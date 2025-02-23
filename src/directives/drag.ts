import { DirectiveBinding } from "vue";

const dragDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    el.style.position = "absolute";
    let startX = 0, startY = 0, initialX = 0, initialY = 0;
    const mouseMoveHandler = (event: MouseEvent) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      el.style.left = `${initialX + dx}px`;
      el.style.top = `${initialY + dy}px`;
    };
    const mouseUpHandler = () => {
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };
    const mouseDownHandler = (event: MouseEvent) => {
      // Solo iniciar si se hace clic sobre el elemento con clase "drag-handle"
      if (!(event.target as HTMLElement).closest(".drag-handle")) return;
      startX = event.clientX;
      startY = event.clientY;
      const rect = el.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
    };
    // Guardar el handler para posible remoción
    el.__mouseDownHandler__ = mouseDownHandler;
    el.addEventListener("mousedown", mouseDownHandler);
  },
  unmounted(el: HTMLElement) {
    if (el.__mouseDownHandler__) {
      el.removeEventListener("mousedown", el.__mouseDownHandler__);
      delete el.__mouseDownHandler__;
    }
  }
};

export default dragDirective;
