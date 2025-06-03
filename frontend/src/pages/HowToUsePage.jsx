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
        <img src={imageUrl || "https://placehold.co/400x300.png?text=Pantalla+de+App"} alt={imageAlt || title} />
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
            Si es tu primera vez, haz clic en "Regístrate" en la página de inicio. Completa tu nombre, email y una contraseña segura. Si ya tienes una cuenta, ingresa tus credenciales en la página de inicio o en <Link to="/login">/login</Link>. Recuerda que la aplicación tiene un temporizador de inactividad por seguridad.
          </p>

          <h3 className="htu-subsection-title">1.2. Tu Primer Día con FinanzasApp Pro</h3>
          <p>
            Una vez que inicies sesión por primera vez, el dashboard podría aparecer vacío o con datos de ejemplo. ¡No te preocupes, es el momento de darle vida a tus finanzas! Te recomendamos seguir estos sencillos pasos:
          </p>

          <div className="htu-first-steps-grid">
            <div className="htu-step-card">
              <div className="htu-step-number">1</div>
              <h4>Crea tu Primera Cuenta (Tu Punto de Partida)</h4>
              <p>
                Antes de registrar cualquier movimiento, necesitas un lugar donde ese dinero reside. Tus cuentas son la base de todo tu seguimiento financiero.
              </p>
              <p>
                **Cómo hacerlo:** Dirígete a la sección **"Cuentas"**. Haz clic en **"Agregar Cuenta"** y crea tu primera cuenta (efectivo, bancaria, tarjeta de crédito, etc.).
              </p>
              <p>
                **Beneficio:** Tendrás una visión clara de dónde está tu dinero.
              </p>
              <img src="https://placehold.co/400x250/e0e6ed/3498db?text=Página+Cuentas" alt="Página de Cuentas con botón Agregar Cuenta" className="htu-step-image" />
            </div>

            <div className="htu-step-card">
              <div className="htu-step-number">2</div>
              <h4>Registra tus Primeros Movimientos (Dale Vida a tus Finanzas)</h4>
              <p>
                Cada ingreso y cada gasto cuenta. Registrar tus transacciones te permite ver exactamente a dónde va tu dinero y de dónde viene.
              </p>
              <p>
                **Cómo hacerlo:** Una vez que tengas al menos una cuenta, ve a la sección **"Movimientos"** o utiliza el botón **"+ Registros"**. Empieza a añadir tus ingresos (ej. tu sueldo) y tus gastos (ej. la compra del supermercado).
              </p>
              <p>
                **Beneficio:** Empezarás a entender tus hábitos de gasto y a identificar patrones.
              </p>
              <img src="https://placehold.co/400x250/e0e6ed/3498db?text=Formulario+Movimiento" alt="Formulario para añadir una nueva transacción" className="htu-step-image" />
            </div>

            <div className="htu-step-card">
              <div className="htu-step-number">3</div>
              <h4>Visualiza tu Resumen en el Dashboard (La Imagen Completa)</h4>
              <p>
                El Dashboard es el corazón de tu control financiero. Con tus cuentas y movimientos registrados, verás cómo tus finanzas cobran vida.
              </p>
              <p>
                **Cómo hacerlo:** Vuelve a la sección **"Dashboard"**. Observa cómo los widgets como "Finanzas del Mes Actual" y "Últimos Registros" empiezan a mostrar información relevante basada en los datos que acabas de ingresar.
              </p>
              <p>
                **Beneficio:** Obtendrás un resumen visual inmediato de tu estado financiero.
              </p>
              <img src="https://placehold.co/400x250/e0e6ed/3498db?text=Dashboard+Completo" alt="Dashboard con widgets poblados" className="htu-step-image" />
            </div>

            <div className="htu-step-card">
              <div className="htu-step-number">4</div>
              <h4>Personaliza y Profundiza (Toma el Control Total)</h4>
              <p>
                FinanzasApp Pro es flexible. Puedes adaptarla a tus necesidades específicas para un control aún mayor.
              </p>
              <p>
                **Cómo hacerlo:** Define categorías, crea presupuestos, y registra inversiones o deudas en sus respectivas secciones.
              </p>
              <p>
                **Beneficio:** La aplicación se adaptará a ti, ofreciéndote insights más precisos y un control financiero sin precedentes.
              </p>
              <img src="https://placehold.co/400x250/e0e6ed/3498db?text=Personalización+Widgets" alt="Modal de selección de widgets o página de categorías" className="htu-step-image" />
            </div>
          </div>
        </section>

        <section className="htu-section">
          <h3 className="htu-subsection-title">1.3. La Interfaz Principal</h3>
          <p>
            Una vez que inicies sesión, verás la interfaz principal, que consta de:
          </p>
          <ul>
            <li>**Barra de Navegación Superior (Navbar):** Contiene el logo de la aplicación, enlaces rápidos a secciones principales (Dashboard, Cuentas, Informes, Configurar) y botones de acción rápida (+ Registros) y Cerrar Sesión.</li>
            <li>**Barra Lateral (Sidebar):** Ubicada a la izquierda, proporciona acceso rápido a todas las secciones de la aplicación, incluyendo las de configuración y administración (si eres administrador). Se expande al pasar el ratón sobre ella.</li>
            <li>**Contenido Principal:** El área central donde se muestra la información de cada sección.</li>
            <li>**Pie de Página (Footer):** Contiene información de derechos de autor y enlaces a los Términos de Servicio y Política de Privacidad.</li>
          </ul>
        </section>

        <section className="htu-section">
          <h2>2. Funcionalidades Principales (Para Usuarios)</h2>
          {/* Aquí el resto de las secciones, siguiendo el formato FeatureSection o h3/p */}
          <FeatureSection
            title="2.1. Dashboard"
            description="El Dashboard es tu centro de control financiero. Aquí verás un resumen visual de tu estado actual a través de widgets personalizables como Finanzas del Mes Actual, Últimos Registros, Resumen de Inversiones, y más."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Dashboard+Widgets"
            imageAlt="Dashboard con varios widgets"
          >
            <p>Puedes **personalizar los widgets** haciendo clic en el icono `⊕` o arrastrándolos y soltándolos para reordenarlos.</p>
          </FeatureSection>

          <FeatureSection
            title="2.2. Cuentas"
            description="Gestiona todas tus cuentas financieras: efectivo, bancarias, tarjetas de crédito, inversiones y billeteras digitales. Tendrás un control detallado de cada una."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Cuentas+Detalle"
            imageAlt="Listado de cuentas"
            reverseOrder={true}
          >
            <ul>
              <li>**Ver Cuentas:** Listado con saldo, tipo, moneda.</li>
              <li>**Agregar/Editar/Eliminar:** Control total sobre tus cuentas.</li>
              <li>**Pagar Resumen de Tarjeta:** Funcionalidad específica para tarjetas de crédito.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.3. Movimientos (Transacciones)"
            description="Registra y gestiona todos tus ingresos, gastos y transferencias. Obtén un resumen preciso de tus flujos de dinero."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Movimientos"
            imageAlt="Tabla de movimientos"
          >
            <ul>
              <li>**Totales Filtrados:** Resumen de ingresos, egresos y neto según tus filtros.</li>
              <li>**Filtrar y Ordenar:** Busca por descripción, tipo, cuenta, categoría, fecha, y ordena las columnas.</li>
              <li>**Compras en Cuotas:** Registra gastos a plazos y gestiona sus cuotas.</li>
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
              <li>**Nuevo Presupuesto:** Define monto, moneda y período (mensual, anual, personalizado).</li>
              <li>**Seguimiento Visual:** Barras de progreso para ver tu gasto actual vs. lo presupuestado.</li>
              <li>**Ver Gastos:** Accede directamente a las transacciones de un presupuesto.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.5. Informes"
            description="Obtén una visión detallada de tus finanzas con gráficos claros y resúmenes. Entiende tus hábitos y toma decisiones informadas."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Informes"
            imageAlt="Gráficos de informes"
          >
            <ul>
              <li>**Gastos por Categoría:** Gráfico de torta para ver la distribución de tus egresos.</li>
              <li>**Ingresos vs. Egresos:** Gráfico de barras/líneas para comparar flujos de dinero en el tiempo.</li>
              <li>**Filtros Avanzados:** Personaliza por rango de fechas y moneda de visualización.</li>
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
              <li>**Valor Actual y Rendimiento:** Visualiza ganancias/pérdidas y el porcentaje de rendimiento.</li>
              <li>**Búsqueda de Símbolos:** Encuentra tickers para acciones y criptomonedas.</li>
              <li>**Actualización de Cotizaciones:** Refresca los valores de tus activos de mercado.</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.7. Deudas y Préstamos"
            description="Lleva un control detallado de lo que debes y lo que te deben. Gestiona pagos y cobros fácilmente."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Deudas+Préstamos"
            imageAlt="Listado de deudas y préstamos"
          >
            <ul>
              <li>**Tipos de Registro:** Define si es una deuda (tú debes) o un préstamo (te deben).</li>
              <li>**Pagos en Cuotas:** Soporte para préstamos de tarjeta a terceros o préstamos directos con devolución en cuotas.</li>
              <li>**Registrar Pagos/Cobros:** Actualiza el estado de tus obligaciones con un solo clic.</li>
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
              <li>**Monto Objetivo y Actual:** Visualiza cuánto te falta para alcanzar cada meta.</li>
              <li>**Prioridad y Estado:** Organiza tus metas por importancia y sigue su estado (activa, pausada, completada).</li>
            </ul>
          </FeatureSection>

          <FeatureSection
            title="2.9. Movimientos Recurrentes"
            description="Automatiza el registro de tus ingresos y gastos fijos para ahorrar tiempo y asegurar la precisión de tus registros."
            imageUrl="https://placehold.co/400x300/e0e6ed/3498db?text=Página+Recurrentes"
            imageAlt="Listado de movimientos recurrentes"
          >
            <ul>
              <li>**Frecuencias Flexibles:** Configura transacciones diarias, semanales, mensuales, anuales, etc.</li>
              <li>**Registro Manual:** Opción para registrar un movimiento recurrente de forma inmediata, incluso si no es su fecha de ejecución.</li>
              <li>**Activar/Desactivar:** Controla fácilmente qué movimientos recurrentes están activos.</li>
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
              <li>**Registro Mensual:** Define la tasa de USD a ARS para cada mes.</li>
              <li>**Historial:** Consulta las tasas registradas previamente.</li>
            </ul>
          </FeatureSection>
        </section>
        <section className="htu-section htu-tips-section">
          <h2>4. Consejos y Mejores Prácticas</h2>
          <p>Para aprovechar al máximo FinanzasApp Pro, considera estos consejos:</p>
          <ul>
            <li>**Registro Consistente:** La clave para unas finanzas claras es registrar todos tus movimientos de manera consistente.</li>
            <li>**Categorización:** Utiliza las categorías de forma efectiva para entender a dónde va tu dinero. Crea categorías personalizadas si las necesitas.</li>
            <li>**Presupuestos Realistas:** Establece presupuestos que sean desafiantes pero alcanzables. Revisa tu progreso regularmente.</li>
            <li>**Actualiza Tasas de Cambio:** Si manejas múltiples monedas, asegúrate de actualizar las tasas de cambio mensualmente para que tus reportes sean precisos.</li>
            <li>**Explora el Dashboard:** Personaliza tu dashboard para que muestre la información más relevante para ti de un vistazo.</li>
            <li>**Reportes:** Utiliza los reportes para identificar tendencias, áreas de mejora y evaluar tu salud financiera general.</li>
            <li>**Fondo de Emergencia:** Prioriza construir un fondo de emergencia que cubra varios meses de gastos.</li>
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