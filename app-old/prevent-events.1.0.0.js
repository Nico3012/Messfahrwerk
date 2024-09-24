// contextmenu becomes a PointerEvent in pointer level 3 specification
["pointerdown", "pointermove", "pointerup", "contextmenu"].forEach((pointerEventType) => {
    document.addEventListener(pointerEventType, (pointerEvent) => {
        pointerEvent.preventDefault();
    }, {
        passive: false
    });
});

// alternative to touch-action css property
["touchstart", "touchmove", "touchend"].forEach((touchEventType) => {
    document.addEventListener(touchEventType, (touchEvent) => {
        touchEvent.preventDefault();
    }, {
        passive: false
    });
});

["keydown", "keyup"].forEach((keyboardEventType) => {
    document.addEventListener(keyboardEventType, (keyboardEvent) => {
        keyboardEvent.preventDefault();
    }, {
        passive: false
    });
});
