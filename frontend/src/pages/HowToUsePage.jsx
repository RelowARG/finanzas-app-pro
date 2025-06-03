// Ruta: frontend/src/pages/HowToUsePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './HowToUsePage.css'; // Importa el CSS específico de esta página

// Componente reutilizable para secciones de características (adaptado de HowItWorksPage)
const FeatureSection = ({ title, description, imageUrl, imageAlt, reverseOrder = false, children }) => {
  return (
    <article className={`htu-feature-section ${reverseOrder ? 'reverse' : ''}`}>
      <div className="htu-feature-text">
        <h3>{title}</h3>
        <p>{description}</p>
        {children} {/* Para listas u otros detalles */}
      </div>
      <div className="htu-feature-image">
        <img src={imageUrl || "https://placehold.co/400x300/e0e6ed/3498db?text=Pantalla+de+App"} alt={imageAlt || title} />
      </div>
    </article>
  );
};

const HowToUsePage = () => {
  React.useEffect(() => {
    document.body.classList.add('how-to-use-page-active');
    return () => {
      document.body.classList.remove('how-to-use-page-active');
    };
  }, []);

  return (
    <div className="page-container-fluid how-to-use-page">
      <header className="htu-main-header">
        <div className="htu-main-header-content">
          <h1>Guía de Uso Exhaustiva: FinanzasApp Pro</h1>
          <p className="htu-main-subtitle">
            ¡Bienvenido! Esta guía te ayudará a entender y aprovechar al máximo todas las funcionalidades de la aplicación para que tomes el control total de tus finanzas personales.
          </p>
          <div className="htu-app-buttons">
            <Link to="/dashboard" className="button button-primary button-large htu-start-button">
              Ir al Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="htu-main-content">
        <section className="htu-section">
          <h2>1. Primeros Pasos</h2>
          <p>
            Antes de sumergirte en los detalles, aquí te explicamos cómo empezar y qué hacer en tu primer día con FinanzasApp Pro.
          </p>

          <h3 className="htu-subsection-title">1.1. Registro e Inicio de Sesión</h3>
          <p>
            Si es tu primera vez, haz clic en "Regístrate" en la página de inicio. Completa tu nombre, email y una contraseña segura. Si ya tienes
            una cuenta, ingresa tus credenciales en la página de inicio o en <Link to="/login">/login</Link>. Recuerda que la aplicación tiene un temporizador de inactividad
            por seguridad.
          </p>

          <h3 className="htu-subsection-title">1.2. Tu Primer Día con FinanzasApp Pro</h3>
          <p>
            Una vez que inicies sesión por primera vez, el dashboard podría aparecer vacío o con datos de ejemplo. ¡No te preocupes, es el
            momento de darle vida a tus finanzas! Te recomendamos seguir estos sencillos pasos:
          </p>

          {/* Paso 1 */}
          <FeatureSection
            title="1. Crea tu Primera Cuenta (Tu Punto de Partida)"
            description="Antes de registrar cualquier movimiento, necesitas un lugar donde ese dinero reside. Tus cuentas son la base de todo tu seguimiento financiero."
            imageUrl="https://placehold.co/400x250/e0e6ed/3498db?text=Página+Cuentas"
            imageAlt="Página de Cuentas con botón Agregar Cuenta"
          >
            <p>
              <strong>Cómo hacerlo:</strong> Dirígete a la sección <strong>"Cuentas"</strong>. Haz clic en
              <strong>"Agregar Cuenta"</strong> y crea tu
              primera cuenta (efectivo, bancaria,
              tarjeta de crédito, etc.).
            </p>
            <p>
              <strong>Beneficio:</strong> Tendrás una visión
              clara de dónde está tu dinero.
            </p>
          </FeatureSection>

          {/* Paso 2 */}
          <FeatureSection
            title="2. Registra tus Primeros Movimientos (Dale Vida a tus Finanzas)"
            description="Cada ingreso y cada gasto cuenta. Registrar tus transacciones te permite ver exactamente a dónde va tu dinero y de dónde viene."
            imageUrl="https://placehold.co/400x250/e0e6ed/3498db?text=Formulario+Movimiento"
            imageAlt="Formulario para añadir una nueva transacción"
            reverseOrder={true}
          >
            <p>
              <strong>Cómo hacerlo:</strong> Una vez que
              tengas al menos una cuenta, ve a la
              sección <strong>"Movimientos"</strong> o utiliza el
              botón <strong>"+ Registros"</strong>. Empieza a
              añadir tus ingresos (ej. tu sueldo) y
              tus gastos (ej. la compra del
              supermercado).
            </p>
            <p>
              <strong>Beneficio:</strong> Empezarás a
              entender tus hábitos de gasto y a
              identificar patrones.
            </p>
          </FeatureSection>

          {/* Paso 3 */}
          <FeatureSection
            title="3. Visualiza tu Resumen en el Dashboard (La Imagen Completa)"
            description="El Dashboard es el corazón de tu control financiero. Con tus cuentas y movimientos registrados, verás cómo tus finanzas cobran vida."
            imageUrl="https://placehold.co/400x250/e0e6ed/3498db?text=Dashboard+Completo"
            imageAlt="Dashboard con widgets poblados"
          >
            <p>
              <strong>Cómo hacerlo:</strong> Vuelve a la
              sección <strong>"Dashboard"</strong>. Observa
              cómo los widgets como "Finanzas
              del Mes Actual" y "Últimos
              Registros" empiezan a mostrar
              información relevante basada en los
              datos que acabas de ingresar.
            </p>
            <p>
              <strong>Beneficio:</strong> Obtendrás un
              resumen visual inmediato de tu
              estado financiero.
            </p>
          </FeatureSection>

          {/* Paso 4 */}
          <FeatureSection
            title="4. Personaliza y Profundiza (Toma el Control Total)"
            description="FinanzasApp Pro es flexible. Puedes adaptarla a tus necesidades específicas para un control aún mayor."
            imageUrl="https://placehold.co/400x250/e0e6ed/3498db?text=Personalización+Widgets"
            imageAlt="Modal de selección de widgets o página de categorías"
            reverseOrder={true}
          >
            <p>
              <strong>Cómo hacerlo:</strong> Define
              categorías, crea presupuestos, y
              registra inversiones o deudas en sus
              respectivas secciones.
            </p>
            <p>
              <strong>Beneficio:</strong> La aplicación se
              adaptará a ti, ofreciéndote insights
              más precisos y un control financiero
              sin precedentes.
            </p>
          </FeatureSection>
        </section>

        <section className="htu-section">
          <h3 className="htu-subsection-title">1.3. La Interfaz Principal</h3>
          <p>
            Una vez que inicies sesión, verás la interfaz principal, que consta de:
          </p>
          <ul>
            <li><strong>Barra de Navegación Superior (Navbar):</strong> Contiene el logo de la aplicación, enlaces rápidos a secciones principales (Dashboard, Cuentas, Informes, Categorías) y botones de acción rápida (+ Registros) y Cerrar Sesión.</li>
            <li><strong>Barra Lateral (Sidebar):</strong> Ubicada a la izquierda, proporciona acceso rápido a todas las secciones de la aplicación, incluyendo las de configuración y administración (si eres administrador). Se expande al pasar el ratón sobre ella.</li>
            <li><strong>Contenido Principal:</strong> El área central donde se muestra la información de cada sección.</li>
            <li><strong>Pie de Página (Footer):</strong> Contiene información de derechos de autor y enlaces a los Términos de Servicio y Política de Privacidad.</li>
          </ul>
        </section>

        <section className="htu-section">
          <h2>2. Funcionalidades Principales (Para Usuarios)</h2>
          <FeatureSection
            title="2.1. Dashboard"
            description="El Dashboard es tu centro de control financiero. Aquí verás un resumen visual de tu estado actual a través de widgets personalizables como Finanzas del Mes Actual, Últimos Registros, Resumen de Inversiones, y más."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Dashboard+Widgets"
            imageAlt="Dashboard con varios widgets"
          >
            <p>Puedes <strong>personalizar los widgets</strong> haciendo clic en el icono `⊕` o arrastrándolos y soltándolos para reordenarlos.</p>
          </FeatureSection>

          <FeatureSection
            title="2.2. Cuentas"
            description="Gestiona todas tus cuentas financieras: efectivo, bancarias, tarjetas de crédito, inversiones y billeteras digitales. Tendrás un control detallado de cada una."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Cuentas+Detalle"
            imageAlt="Listado de cuentas"
            reverseOrder={true}
          >
            <ul>
              <li><strong>Ver Cuentas:</strong> Listado con saldo, tipo, moneda.</li>
              <li><strong>Agregar/Editar/Eliminar:</strong> Control total sobre tus cuentas.</li>
              <li><strong>Pagar Resumen de Tarjeta:</strong> Funcionalidad específica para tarjetas de crédito.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.3. Movimientos (Transacciones)"
            description="Registra y gestiona todos tus ingresos, gastos y transferencias. Obtén un resumen preciso de tus flujos de dinero."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Movimientos"
            imageAlt="Tabla de movimientos"
          >
            <ul>
              <li><strong>Totales Filtrados:</strong> Resumen de ingresos, egresos y neto según tus filtros.</li>
              <li><strong>Filtrar y Ordenar:</strong> Busca por descripción, tipo, cuenta, categoría, fecha, y ordena las columnas.</li>
              <li><strong>Compras en Cuotas:</strong> Registra gastos a plazos y gestiona sus cuotas.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.4. Presupuestos"
            description="Crea límites de gasto por categoría y período para controlar tu dinero y alcanzar tus metas de ahorro."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Presupuestos"
            imageAlt="Listado de presupuestos"
            reverseOrder={true}
          >
            <ul>
              <li><strong>Nuevo Presupuesto:</strong> Define monto, moneda y período (mensual, anual, personalizado).</li>
              <li><strong>Seguimiento Visual:</strong> Barras de progreso para ver tu gasto actual vs. lo presupuestado.</li>
              <li><strong>Ver Gastos:</strong> Accede directamente a las transacciones de un presupuesto.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.5. Informes"
            description="Obtén una visión detallada de tus finanzas con gráficos claros y resúmenes. Entiende tus hábitos y toma decisiones informadas."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Informes"
            imageAlt="Gráficos de informes"
          >
            <ul>
              <li><strong>Gastos por Categoría:</strong> Gráfico de torta para ver la distribución de tus egresos.</li>
              <li><strong>Ingresos vs. Egresos:</strong> Gráfico de barras/líneas para comparar flujos de dinero en el tiempo.</li>
              <li><strong>Filtros Avanzados:</strong> Personaliza por rango de fechas y moneda de visualización.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.6. Inversiones"
            description="Centraliza y monitorea el crecimiento de tus activos. Lleva un registro de Plazos Fijos, Acciones, Criptomonedas, FCI y más."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Inversiones"
            imageAlt="Listado de inversiones"
            reverseOrder={true}
          >
            <ul>
              <li><strong>Valor Actual y Rendimiento:</strong> Visualiza ganancias/pérdidas y el porcentaje de rendimiento.</li>
              <li><strong>Búsqueda de Símbolos:</strong> Encuentra tickers para acciones y criptomonedas.</li>
              <li><strong>Actualización de Cotizaciones:</strong> Refresca los valores de tus activos de mercado.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.7. Deudas y Préstamos"
            description="Lleva un control detallado de lo que debes y lo que te deben. Gestiona pagos y cobros fácilmente."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Deudas+Préstamos"
            imageAlt="Listado de deudas y préstamos"
          >
            <ul>
              <li><strong>Tipos de Registro:</strong> Define si es una deuda (tú debes) o un préstamo (te deben).</li>
              <li><strong>Pagos en Cuotas:</strong> Soporte para préstamos de tarjeta a terceros o préstamos directos con devolución en cuotas.</li>
              <li><strong>Registrar Pagos/Cobros:</strong> Actualiza el estado de tus obligaciones con un solo clic.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.8. Metas"
            description="Define tus objetivos financieros y sigue tu progreso para alcanzarlos. Desde el fondo de emergencia hasta las vacaciones soñadas."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Metas"
            imageAlt="Listado de metas de ahorro"
            reverseOrder={true}
          >
            <ul>
              <li><strong>Monto Objetivo y Actual:</strong> Visualiza cuánto te falta para alcanzar cada meta.</li>
              <li><strong>Prioridad y Estado:</strong> Organiza tus metas por importancia y sigue su estado (activa, pausada, completada).</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.9. Movimientos Recurrentes"
            description="Automatiza el registro de tus ingresos y gastos fijos para ahorrar tiempo y asegurar la precisión de tus registros."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Recurrentes"
            imageAlt="Listado de movimientos recurrentes"
          >
            <ul>
              <li><strong>Frecuencias Flexibles:</strong> Configura transacciones diarias, semanales, mensuales, anuales, etc.</li>
              <li><strong>Registro Manual:</strong> Opción para registrar un movimiento recurrente de forma inmediata, incluso si no es su fecha de ejecución.</li>
              <li><strong>Activar/Desactivar:</strong> Controla fácilmente qué movimientos recurrentes están activos.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.10. Tasas de Cambio"
            description="Si manejas múltiples monedas, registra y actualiza las tasas de cambio mensuales para asegurar la precisión de tus reportes consolidados."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Tasas+Cambio"
            imageAlt="Página de tasas de cambio"
            reverseOrder={true}
          >
            <ul>
              <li><strong>Registro Mensual:</strong> Define la tasa de USD a ARS para cada mes.</li>
              <li><strong>Historial:</strong> Consulta las tasas registradas previamente.</li>
            </ul>
          </FeatureSection>
        </section>

        <section className="htu-section htu-tips-section">
          <h2>3. Consejos y Mejores Prácticas</h2>
          <p>Para aprovechar al máximo FinanzasApp Pro, considera estos consejos:</p>
          <ul>
            <li><strong>Registro Consistente:</strong> La clave para unas finanzas claras es registrar todos tus movimientos de manera consistente.</li>
            <li><strong>Categorización:</strong> Utiliza las categorías de forma efectiva para entender a dónde va tu dinero. Crea categorías personalizadas si las necesitas.</li>
            <li><strong>Presupuestos Realistas:</strong> Establece presupuestos que sean desafiantes pero alcanzables. Revisa tu progreso regularmente.</li>
            <li><strong>Actualiza Tasas de Cambio:</strong> Si manejas múltiples monedas, asegúrate de actualizar las tasas de cambio mensualmente para que tus reportes sean precisos.</li>
            <li><strong>Explora el Dashboard:</strong> Personaliza tu dashboard para que muestre la información más relevante para ti de un vistazo.</li>
            <li><strong>Reportes:</strong> Utiliza los reportes para identificar tendencias, áreas de mejora y evaluar tu salud financiera general.</li>
            <li><strong>Fondo de Emergencia:</strong> Prioriza construir un fondo de emergencia que cubra varios meses de gastos.</li>
          </ul>
        </section>

        <section className="htu-cta-final">
          <h2>¿Listo para tomar el control de tus finanzas?</h2>
          <Link to="/register" className="button button-primary button-xlarge">
            Comienza Gratis con FinanzasApp Pro
          </Link>
        </section>

        <section className="htu-support-section-bottom">
          <h3>¿Preguntas o quieres apoyar el proyecto?</h3>
          <p>
            Visita nuestra sección de [Ayuda/Contacto] o, si la app te es útil,
            ¡considera invitarnos un cafecito para seguir mejorando!
          </p>
          <div className="cafecito-button-container-htu">
            <a href='https://cafecito.app/finanzasapp' rel='noopener noreferrer' target='_blank'>
              <img
                srcSet='https://cdn.cafecito.app/imgs/buttons/button_5.png 1x, https://cdn.cafecito.app/imgs/buttons/button_5_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_5_3.75x.png 3.75x'
                src='https://cdn.cafecito.app/imgs/buttons/button_5.png'
                alt='Invitame un café en cafecito.app'
                style={{height: '54px', width: '194px'}}
              />
            </a>
          </div>
        </section>
      </main>

       <footer className="htu-page-footer">
        <p>&copy; {new Date().getFullYear()} FinanzasApp Pro. Todos los derechos reservados.</p>
        <p>
          <Link to="/terms">Términos de Servicio</Link> | <Link to="/privacy">Política de Privacidad</Link>
        </p>
      </footer>
    </div>
  );
};

export default HowToUsePage;