// Ruta: src/components/dashboard/SortableWidget.jsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableWidget = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'none', // Prevenir 'none' si no hay transición definida por Dnd Kit
    opacity: isDragging ? 0.75 : 1,
    cursor: 'grab',
    boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.15)' : undefined, // Sombra más pronunciada al arrastrar
    zIndex: isDragging ? 100 : 'auto', // Asegurar que el widget arrastrado esté por encima
    // Los widgets ya tienen una altura fija de 300px via .dashboard-widget
    // Si la altura fuera variable, aquí se podrían necesitar más ajustes para el placeholder
  };

  // Mientras se arrastra, el SortableContext puede renderizar un placeholder.
  // El widget original se renderiza con el estilo de transformación.

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Renderizar el contenido real del widget pasado como children */}
      {props.children}
    </div>
  );
};

export default SortableWidget;