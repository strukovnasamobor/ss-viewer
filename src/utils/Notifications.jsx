import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from './VapidKeyPulic';

const NOTIFICATION_SERVER = "https://ss-viewer-notifs-api.onrender.com";
const NOTIFICATION_CHANNEL_ID = "schedule-changes";
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Entity -> request body key. Endpoints are /<entity>/subscribe and /<entity>/unsubscribe
const ID_KEYS = {
  class: "classId",
  teacher: "teacherId",
  classroom: "classroomId",
};

// Notification data.entity -> route
const ENTITY_ROUTES = ["teachers", "classes", "classrooms"];

// True only inside the Capacitor Android app, false in the browser and in the TWA
const isNative = Capacitor.isNativePlatform();

let fcmTokenPromise;

// Native: ask for permission, create the channel and register with FCM (once per app start)
function getFcmToken() {
  if (!fcmTokenPromise) {
    fcmTokenPromise = (async () => {
      let permission = await PushNotifications.checkPermissions();
      if (permission.receive.startsWith("prompt")) {
        permission = await PushNotifications.requestPermissions();
      }
      if (permission.receive !== "granted") {
        throw new Error("Notification permission denied.");
      }

      await PushNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: "Promjene rasporeda",
        importance: 4,
      });

      let listeners = [];
      return new Promise((resolve, reject) => {
        listeners = [
          PushNotifications.addListener("registration", ({ value }) => resolve(value)),
          PushNotifications.addListener("registrationError", ({ error }) => reject(new Error(error))),
        ];
        PushNotifications.register().catch(reject);
      }).finally(() => listeners.forEach(async (listener) => (await listener).remove()));
    })();

    // Allow a retry on the next subscribe
    fcmTokenPromise.catch(() => { fcmTokenPromise = undefined; });
  }
  return fcmTokenPromise;
}

// Returns { key, body } for the current device, asking for permission if needed
async function getSubscriber() {
  if (isNative) {
    const fcmToken = await getFcmToken();
    return { key: fcmToken, body: { fcmToken } };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied.");
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  return { key: subscription.endpoint, body: { subscription } };
}

// Like getSubscriber, but never asks for permission. Returns null if not subscribed
async function getExistingSubscriber() {
  if (isNative) {
    const permission = await PushNotifications.checkPermissions();
    if (permission.receive !== "granted") return null;
    const fcmToken = await getFcmToken();
    return { key: fcmToken, body: { fcmToken } };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? { key: subscription.endpoint, body: { subscription } } : null;
}

function readSync(entity) {
  try {
    return JSON.parse(localStorage.getItem(`notifSync_${entity}`));
  } catch {
    return null;
  }
}

function writeSync(entity, value) {
  try {
    if (value) {
      localStorage.setItem(`notifSync_${entity}`, JSON.stringify(value));
    } else {
      localStorage.removeItem(`notifSync_${entity}`);
    }
  } catch {
    // Storage unavailable, the next start just subscribes again
  }
}

function postToServer(entity, action, id, body) {
  return fetch(`${NOTIFICATION_SERVER}/${entity}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      [ID_KEYS[entity]]: id,
      ...body,
    }),
  });
}

async function subscribeNotification(entity, id) {
  console.log(`Notifications > subscribe ${entity}_${id}`);

  try {
    const subscriber = await getSubscriber();

    // Skip the request (a Firestore write on the server) if this device already subscribed today
    const sync = readSync(entity);
    if (sync && sync.id === id && sync.key === subscriber.key && Date.now() - sync.at < SYNC_INTERVAL_MS) {
      console.log(`Notifications > ${entity}_${id} already subscribed`);
      return;
    }

    const response = await postToServer(entity, "subscribe", id, subscriber.body);
    if (response.ok) {
      writeSync(entity, { id, key: subscriber.key, at: Date.now() });
      console.log(`[SUBSCRIBED] ${entity}_${id}`);
    } else {
      console.error("Notifications > Failed to save subscription", await response.text());
    }
  } catch (error) {
    console.error("Notifications > subscribe > Error:", error);
  }
}

async function unsubscribeNotification(entity, id) {
  console.log(`Notifications > unsubscribe ${entity}_${id}`);
  writeSync(entity, null);

  try {
    const subscriber = await getExistingSubscriber();
    if (!subscriber) {
      console.log("Notifications > No active subscription found.");
      return;
    }

    // The browser subscription (or FCM token) is shared by all entities, so it stays active locally
    const response = await postToServer(entity, "unsubscribe", id, subscriber.body);
    if (response.ok) {
      console.log(`[UNSUBSCRIBED] ${entity}_${id}`);
    } else {
      console.error("Notifications > Failed to unsubscribe", await response.text());
    }
  } catch (error) {
    console.error("Notifications > unsubscribe > Error:", error);
  }
}

// Requests for one entity run in order, so a quick un-save + re-save can't reach the server reversed
const entityQueues = {};
function enqueue(entity, task) {
  entityQueues[entity] = (entityQueues[entity] || Promise.resolve()).then(task);
}

// Keeps the server subscription in sync with the saved id of one entity
export function useNotificationSubscription(entity, savedId) {
  const prevIdRef = useRef();

  useEffect(() => {
    const prevId = prevIdRef.current;

    if (savedId !== prevId) {
      if (prevId) {
        enqueue(entity, () => unsubscribeNotification(entity, prevId));
      }
      if (savedId) {
        enqueue(entity, () => subscribeNotification(entity, savedId));
      }
    }

    prevIdRef.current = savedId;
  }, [entity, savedId]);
}

// Native: calls onTap({ entity, id }) when a push notification is tapped, also after a cold start
export function useNotificationTap(onTap) {
  const onTapRef = useRef(onTap);

  useEffect(() => {
    onTapRef.current = onTap;
  });

  useEffect(() => {
    if (!isNative) return;

    const listener = PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
      const { entity, id } = notification.data || {};
      if (ENTITY_ROUTES.includes(entity)) {
        onTapRef.current({ entity, id });
      }
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, []);
}
