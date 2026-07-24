import "./ZoomableArea.css"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useState } from "react";

export default function ZoomableArea({ children, onPannableChange }) {
    const [isPannable, setIsPannable] = useState(false);
  
    return (
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={4}
        onZoom={({ state }) => {
          const pannable = state.scale > 1;
          setIsPannable(pannable);
          if (onPannableChange) onPannableChange(pannable);
        }}
        doubleClick={{ disabled: true }}
        wheel={{ disabled: true }} 
        panning={{
          disabled: !isPannable,
        }}
      >
        <TransformComponent>
          {children}
        </TransformComponent>
      </TransformWrapper>
    );
}