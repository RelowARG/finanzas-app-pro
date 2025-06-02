// finanzas-app-pro/frontend/src/pages/PrivacyPolicyPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css'; // Usaremos un CSS común para estas páginas

const PrivacyPolicyPage = () => {
  const appName = "FinanzasApp Pro";
  const companyName = "FinanzasApp";
  const effectiveDate = "1 de junio de 2025";
  const supportEmail = "juliangrlw@gmail.com";
  const websiteUrl = "https://finanzas-app-pro.vercel.app/";

  React.useEffect(() => {
    document.body.classList.add('legal-page-active');
    return () => {
      document.body.classList.remove('legal-page-active');
    };
  }, []);

  return (
    <>
      <div className="legal-main-title-header">
        <h1>Política de Privacidad</h1>
      </div>

      <div className="page-container legal-page-container">
        <header className="legal-page-header">
          <p className="legal-effective-date">Última actualización: {effectiveDate}</p>
        </header>

        <section className="legal-page-content">
          <p>
            {companyName} ("nosotros", "nos", o "nuestro") opera la aplicación móvil {appName} y el sitio web asociado (si aplica)
            (en adelante, el "Servicio").
          </p>
          <p>
            Esta página te informa de nuestras políticas relativas a la recopilación, uso y divulgación de datos personales cuando utilizas
            nuestro Servicio y las opciones que has asociado con esos datos. Utilizamos tus datos para proporcionar y mejorar el Servicio.
            Al utilizar el Servicio, aceptas la recopilación y el uso de información de acuerdo con esta política. A menos que se defina
            lo contrario en esta Política de Privacidad, los términos utilizados en esta Política de Privacidad tienen el mismo significado que en nuestros
            <Link to="/terms">Términos de Servicio</Link>.
          </p>

          {/* ... Resto del contenido de la Política de Privacidad como estaba ... */}
            <h2>1. Información que Recopilamos</h2>
            <p>
            Recopilamos varios tipos diferentes de información para diversos fines para proporcionar y mejorar nuestro Servicio para ti.
            </p>
            <h3>Tipos de Datos Recopilados</h3>
            <h4>a. Datos Personales</h4>
            <p>
            Mientras utilizas nuestro Servicio, podemos pedirte que nos proporciones cierta información de identificación personal que puede ser utilizada
            para contactarte o identificarte ("Datos Personales"). La información de identificación personal puede incluir, entre otros:
            </p>
            <ul>
            <li>Dirección de correo electrónico (para creación de cuenta y comunicación)</li>
            <li>Nombre (para personalizar tu experiencia)</li>
            <li>Contraseña (encriptada, para la seguridad de tu cuenta)</li>
            <li>Configuración de la aplicación (como preferencias del dashboard, widgets visibles)</li>
            </ul>
            <h4>b. Datos Financieros Ingresados por el Usuario</h4>
            <p>
            El propósito principal de {appName} es ayudarte a gestionar tus finanzas. Para ello, ingresarás datos financieros que pueden incluir:
            </p>
            <ul>
            <li>Información de cuentas: Nombres de cuentas, tipos (efectivo, banco, tarjeta de crédito), saldos, moneda, números de cuenta parciales (si los proporcionas), límites de crédito.</li>
            <li>Transacciones: Descripciones, montos, fechas, categorías, notas asociadas.</li>
            <li>Presupuestos: Montos, categorías, períodos.</li>
            <li>Inversiones: Tipos, montos, fechas, rendimientos, tickers (si los proporcionas).</li>
            <li>Deudas y Préstamos: Descripciones, personas involucradas, montos, fechas.</li>
            </ul>
            <p>
            <strong>Importante:</strong> {appName} está diseñado para que estos datos financieros sean gestionados localmente en tu cuenta dentro de nuestros servidores seguros
            y <strong>no se comparten con terceros con fines de marketing ni se venden</strong>.
            Actualmente, {appName} <strong>no</strong> tiene la funcionalidad de conectarse directamente a tus cuentas bancarias o instituciones financieras para
            importar datos automáticamente. Toda la información financiera es ingresada manually por ti.
            </p>

            <h4>c. Datos de Uso (Opcional y Futuro)</h4>
            <p>
            Podríamos recopilar información sobre cómo se accede y utiliza el Servicio ("Datos de Uso"). Estos Datos de Uso pueden incluir
            información como la dirección del Protocolo de Internet de tu computadora (por ejemplo, dirección IP), tipo de navegador,
            versión del navegador, las páginas de nuestro Servicio que visitas, la hora y fecha de tu visita, el tiempo dedicado a esas páginas,
            identificadores únicos de dispositivos y otros datos de diagnóstico. Esta información se usaría de forma anónima y agregada
            para mejorar la funcionalidad y el rendimiento de la aplicación.
            </p>

            <h2>2. Uso de los Datos</h2>
            <p>{companyName} utiliza los datos recopilados para diversos fines:</p>
            <ul>
            <li>Para proporcionar y mantener nuestro Servicio.</li>
            <li>Para notificarte sobre cambios en nuestro Servicio.</li>
            <li>Para permitirte participar en funciones interactivas de nuestro Servicio cuando elijas hacerlo.</li>
            <li>Para proporcionar soporte al cliente.</li>
            <li>Para recopilar análisis o información valiosa para que podamos mejorar nuestro Servicio (generalmente de forma anónima y agregada).</li>
            <li>Para monitorear el uso de nuestro Servicio.</li>
            <li>Para detectar, prevenir y abordar problemas técnicos.</li>
            <li>Para cumplir con cualquier otro propósito para el que lo proporciones.</li>
            <li>Para cumplir con nuestras obligaciones y hacer cumplir nuestros derechos derivados de cualquier contrato celebrado entre tú y nosotros, incluyendo la facturación y el cobro (si aplica en el futuro).</li>
            </ul>

            <h2>3. Almacenamiento y Seguridad de los Datos</h2>
            <p>
            La seguridad de tus datos es importante para nosotros. Almacenamos tus datos en servidores seguros.
            Tu contraseña se almacena de forma encriptada (hashed). Si bien nos esforzamos por utilizar medios comercialmente aceptables para proteger
            tus Datos Personales y Financieros, recuerda que ningún método de transmisión por Internet o método de almacenamiento electrónico es 100% seguro.
            </p>
            <p>
            Tus datos financieros ingresados se consideran confidenciales y se utilizan únicamente para proporcionarte las funcionalidades de {appName}.
            </p>

            <h2>4. Retención de Datos</h2>
            <p>
            {companyName} conservará tus Datos Personales y Financieros solo durante el tiempo que sea necesario para los fines establecidos en esta Política de Privacidad,
            o mientras tu cuenta esté activa. Conservaremos y utilizaremos tus datos en la medida necesaria para cumplir con nuestras obligaciones legales
            (por ejemplo, si estamos obligados a conservar tus datos para cumplir con las leyes aplicables), resolver disputas y hacer cumplir nuestros
            acuerdos y políticas legales.
            </p>
            <p>
            Puedes eliminar tu cuenta y tus datos asociados en cualquier momento a través de la configuración de la aplicación (si esta funcionalidad está disponible)
            o contactándonos en {supportEmail}.
            </p>
            
            <h2>5. Transferencia de Datos</h2>
            <p>
            Tu información, incluyendo Datos Personales, puede ser transferida a —y mantenida en— computadoras ubicadas fuera de tu estado,
            provincia, país u otra jurisdicción gubernamental donde las leyes de protección de datos pueden diferir de las de tu jurisdicción.
            Si te encuentras fuera de [Tu País] y eliges proporcionarnos información, ten en cuenta que transferimos los datos,
            incluyendo Datos Personales, a [Tu País] y los procesamos allí.
            </p>
            <p>
            Tu consentimiento a esta Política de Privacidad seguido de tu envío de dicha información representa tu acuerdo con esa transferencia.
            {companyName} tomará todas las medidas razonablemente necesarias para garantizar que tus datos se traten de forma segura y de acuerdo
            con esta Política de Privacidad y no se realizará ninguna transferencia de tus Datos Personales a una organización o país a menos que
            existan controles adecuados, incluida la seguridad de tus datos y otra información personal.
            </p>

            <h2>6. Divulgación de Datos</h2>
            <p>
            Podemos divulgar Datos Personales que recopilamos o que tú proporcionas:
            </p>
            <ul>
            <li><strong>Cumplimiento de la ley:</strong> Bajo ciertas circunstancias, es posible que se nos exija divulgar tus Datos Personales si así lo exige la ley o en respuesta a solicitudes válidas de autoridades públicas.</li>
            <li><strong>Transacción comercial:</strong> Si nosotros o nuestras filiales estamos involucrados en una fusión, adquisición o venta de activos, tus Datos Personales pueden ser transferidos.</li>
            </ul>

            <h2>7. Tus Derechos de Protección de Datos</h2>
            <p>
            Dependiendo de tu jurisdicción, puedes tener ciertos derechos de protección de datos. Estos pueden incluir el derecho a:
            </p>
            <ul>
            <li>Acceder, actualizar o eliminar la información que tenemos sobre ti.</li>
            <li>Rectificar información inexacta o incompleta.</li>
            <li>Oponerte a nuestro procesamiento de tus Datos Personales.</li>
            <li>Solicitar que restrinjamos el procesamiento de tu información personal.</li>
            <li>La portabilidad de los datos (solicitar una copia de tu información en un formato estructurado, de uso común y legible por máquina).</li>
            <li>Retirar tu consentimiento en cualquier momento cuando nos basamos en tu consentimiento para procesar tu información personal.</li>
            </ul>
            <p>
            Para ejercer cualquiera de estos derechos, por favor contáctanos en {supportEmail}.
            </p>

            <h2>8. Privacidad de los Niños</h2>
            <p>
            Nuestro Servicio no está dirigido a menores de 18 años ("Niños"). No recopilamos conscientemente información de identificación
            personal de Niños. Si eres padre o tutor y sabes que tu hijo nos ha proporcionado Datos Personales, por favor contáctanos.
            Si nos damos cuenta de que hemos recopilado Datos Personales de niños sin verificación del consentimiento paterno, tomamos
            medidas para eliminar esa información de nuestros servidores.
            </p>

            <h2>9. Cambios a esta Política de Privacidad</h2>
            <p>
            Podemos actualizar nuestra Política de Privacidad de vez en cuando. Te notificaremos cualquier cambio publicando la nueva Política
            de Privacidad en esta página y actualizando la "fecha de entrada en vigor" en la parte superior de esta Política de Privacidad.
            </p>
            <p>
            Se te aconseja revisar esta Política de Privacidad periódicamente para cualquier cambio. Los cambios a esta Política de Privacidad
            son efectivos cuando se publican en esta página.
            </p>

            <h2>10. Contáctanos</h2>
            <p>
            Si tienes alguna pregunta sobre esta Política de Privacidad, por favor contáctanos:
            <br />
            Por correo electrónico: {supportEmail}
            {websiteUrl && <>
                <br />Visitando esta página en nuestro sitio web: <a href={websiteUrl + "/privacy"} target="_blank" rel="noopener noreferrer">{websiteUrl}/privacy</a>
            </>}
            </p>
        </section>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;