// Ruta: finanzas-app-pro/frontend/src/pages/HowItWorksPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './HowItWorksPage.css'; // Estaremos modificando este CSS

// --- Componente reutilizable para secciones de características ---
const FeatureSection = ({ title, description, imageUrl, imageAlt, reverseOrder = false, children }) => {
  return (
    <article className={`hiw-feature-section ${reverseOrder ? 'reverse' : ''}`}>
      <div className="hiw-feature-text">
        <h3>{title}</h3>
        <p>{description}</p>
        {children} {/* Para listas u otros detalles */}
      </div>
      <div className="hiw-feature-image">
        {/* DEBERÁS REEMPLAZAR ESTO CON TUS PROPIAS IMÁGENES */}
        <img src={imageUrl || "https://via.placeholder.com/400x300.png?text=Pantalla+de+App"} alt={imageAlt || title} />
      </div>
    </article>
  );
};


const HowItWorksPage = () => {
  return (
    <div className="page-container-fluid how-it-works-page-new"> {/* Usar page-container-fluid si quieres ancho completo */}
      <header className="hiw-main-header">
        <div className="hiw-main-header-content">
          <h1>¿Qué es FinanzasApp Pro y cómo funciona?</h1>
          <p className="hiw-main-subtitle">
            Conocimiento es poder. Necesitas conocer tus finanzas para dominarlas.
            FinanzasApp Pro es tu dinero en una app, bajo tu control, donde sea que estés.
            Sincronizando automáticamente (¡próximamente!) con tus entidades financieras, Wallet te ayuda a predecir y planificar
            un futuro financiero más próspero mientras ahorras cada día.
          </p>
          <div className="hiw-app-buttons">
            {/* Si tienes enlaces a tiendas de apps, ponlos aquí */}
            {/* <a href="#" target="_blank" rel="noopener noreferrer"><img src="/path-to-google-play-badge.png" alt="Get it on Google Play" /></a> */}
            {/* <a href="#" target="_blank" rel="noopener noreferrer"><img src="/path-to-app-store-badge.png" alt="Download on the App Store" /></a> */}
            <Link to="/register" className="button button-primary button-large hiw-try-button">
              Prueba FinanzasApp Pro
            </Link>
          </div>
        </div>
        <div className="hiw-main-header-image">
          {/* DEBERÁS REEMPLAZAR ESTO CON UNA IMAGEN ATRACTIVA DE TU APP */}
          <img src="https://via.placeholder.com/300x550.png?text=FinanzasApp+en+Móvil" alt="FinanzasApp Pro en acción" />
        </div>
      </header>

      {/* Puedes añadir una sección de "calificación" o "logos de confianza" aquí si lo tienes, similar a BudgetBakers */}
      {/* <section className="hiw-ratings-section">
        <div className="hiw-star-rating">
          <span className="star">⭐</span> 4.7 Estrellas en Tienda X (1,000+ reseñas)
        </div>
      </section> 
      */}

      <main className="hiw-main-content">
        <FeatureSection
          title="Todo en Un Solo Lugar (Cuentas/Billeteras)"
          description="FinanzasApp Pro te permite conectar (manual o automáticamente próximamente) todas tus cuentas y proveedores financieros, dándote una visión única y completa de todo tu dinero."
          imageUrl="/img/placeholder-cuentas.png" // Reemplaza con tu imagen
          imageAlt="Vista de Cuentas en FinanzasApp Pro"
        >
          <p>Registra: Efectivo, Cuentas Bancarias, Tarjetas de Crédito, Billeteras Digitales, Inversiones y más.</p>
        </FeatureSection>

        <FeatureSection
          title="Categorías Inteligentes (Movimientos)"
          description="FinanzasApp Pro categoriza tus transacciones (ingresos y egresos) para que organizar tus gastos y entender tus hábitos sea increíblemente fácil."
          imageUrl="/img/placeholder-movimientos.png" // Reemplaza con tu imagen
          imageAlt="Registro de Movimientos y Categorías"
          reverseOrder={true}
        >
          <p>Cada movimiento afecta el saldo de su cuenta asociada, dándote control en tiempo real.</p>
        </FeatureSection>

        <FeatureSection
          title="Presupuestos: Controla tus Gastos"
          description="Define límites de gasto por categoría y período (mensual, quincenal, etc.) y observa tu progreso para evitar sorpresas y alcanzar tus metas de ahorro."
          imageUrl="/img/placeholder-presupuestos.png" // Reemplaza con tu imagen
          imageAlt="Presupuestos en FinanzasApp Pro"
        >
           {/* <Link to="/docs/presupuestos" className="button button-outline-green">Leer más</Link> */}
        </FeatureSection>
        
        <FeatureSection
          title="Seguimiento de Inversiones"
          description="Centraliza y monitorea el crecimiento de tus Plazos Fijos, Acciones, Criptomonedas, FCI y más. Entiende el rendimiento de tu portafolio."
          imageUrl="/img/placeholder-inversiones.png" // Reemplaza con tu imagen
          imageAlt="Seguimiento de Inversiones"
          reverseOrder={true}
        >
        </FeatureSection>

        <FeatureSection
          title="Informes: La Gran Imagen de tus Finanzas"
          description="Obtén una alta visibilidad de tu estado financiero actual y proyectado con informes claros: Gastos por Categoría, Ingresos vs. Egresos, Tendencia de Saldo, y más."
          imageUrl="/img/placeholder-informes.png" // Reemplaza con tu imagen
          imageAlt="Informes Financieros"
        >
          {/* <Link to="/docs/informes" className="button button-outline-green">Leer más</Link> */}
        </FeatureSection>

        <section className="hiw-additional-tools">
          <h2>Más Herramientas para Potenciarte</h2>
          <div className="hiw-tools-grid">
            <div className="hiw-tool-item">
              <h4>Movimientos Recurrentes</h4>
              <p>Automatiza el registro de tus gastos e ingresos fijos (alquiler, sueldos, suscripciones).</p>
            </div>
            <div className="hiw-tool-item">
              <h4>Deudas y Préstamos</h4>
              <p>Lleva un control de lo que debes y te deben, con fechas y montos.</p>
            </div>
            <div className="hiw-tool-item">
              <h4>Tasas de Cambio</h4>
              <p>Registra tasas para convertir saldos y movimientos si manejas múltiples monedas.</p>
            </div>
            {/* <div className="hiw-tool-item">
              <h4>(Próximamente) Sincronización Bancaria</h4>
              <p>Conecta tus bancos para una importación automática de movimientos.</p>
            </div> */}
          </div>
        </section>
      </main>
      
      <section className="hiw-cta-final">
        <h2>¿Listo para tomar el control de tus finanzas?</h2>
        <Link to="/register" className="button button-primary button-xlarge">
          Comienza Gratis con FinanzasApp Pro
        </Link>
      </section>

      <section className="hiw-support-section-bottom">
        <h3>¿Preguntas o quieres apoyar el proyecto?</h3>
        <p>
          Visita nuestra sección de [Ayuda/Contacto] o, si la app te es útil,
          ¡considera invitarnos un cafecito para seguir mejorando!
        </p>
        <div className="cafecito-button-container-hiw">
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

       <footer className="hiw-page-footer">
        <p>&copy; {new Date().getFullYear()} FinanzasApp Pro. Todos los derechos reservados.</p>
        <p>
          <Link to="/terms">Términos de Servicio</Link> | <Link to="/privacy">Política de Privacidad</Link>
        </p>
      </footer>
    </div>
  );
};

export default HowItWorksPage;