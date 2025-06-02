import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const TermsOfServicePage = () => {
  const appName = "FinanzasApp Pro";
  const companyName = "FinanzasApp";
  const effectiveDate = "1 de junio de 2025";
  const supportEmail = "juliangrlw@gmail.com";
  const websiteUrl = "https://finanzas-app-pro.vercel.app/";

  // Opcional: Añadir clase al body
  React.useEffect(() => {
    document.body.classList.add('legal-page-active');
    return () => {
      document.body.classList.remove('legal-page-active');
    };
  }, []);

  return (
    <> {/* Usar Fragment si el contenedor principal ya no es .page-container */}
      <div className="legal-main-title-header">
        <h1>Términos de Servicio</h1> {/* Título principal grande */}
        {/* La fecha de actualización puede ir aquí o dentro del .legal-page-container */}
      </div>

      <div className="page-container legal-page-container"> {/* Contenedor blanco para el contenido */}
        <header className="legal-page-header">
          {/* Podrías poner el título "Términos de Servicio de FinanzasApp Pro" aquí si prefieres,
              o solo la fecha de actualización si el H1 ya está arriba */}
          <p className="legal-effective-date">Última actualización: {effectiveDate}</p>
        </header>

        <section className="legal-page-content">
          <p>
            Bienvenido a {appName}. Estos Términos de Servicio ("Términos") rigen tu acceso y uso de la aplicación móvil {appName},
            el sitio web asociado (si aplica), y cualquier contenido, característica y servicio ofrecido por {appName} (colectivamente, los "Servicios"),
            operado por {companyName} ("nosotros", "nos", o "nuestro").
          </p>
          <p>
            Por favor, lee estos Términos cuidadosamente antes de usar nuestros Servicios. Al acceder o usar los Servicios, aceptas estar sujeto a estos Términos.
            Si no estás de acuerdo con alguna parte de los términos, entonces no puedes acceder a los Servicios.
          </p>

          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al crear una cuenta, acceder o usar los Servicios, confirmas que has leído, entendido y aceptado estar legalmente obligado por estos Términos
            y nuestra <Link to="/privacy">Política de Privacidad</Link>, que se incorpora aquí por referencia. Si no aceptas estos Términos, no debes usar los Servicios.
          </p>

          {/* ... Resto del contenido como estaba ... */}
            <h2>2. Descripción del Servicio</h2>
            <p>
            {appName} es una aplicación de finanzas personales diseñada para ayudarte a rastrear tus ingresos, gastos, presupuestos,
            inversiones y gestionar tus finanzas de manera más efectiva. Las características pueden incluir, entre otras,
            registro manual de transacciones, creación de presupuestos, informes financieros, y seguimiento de cuentas.
            Actualmente, {appName} no se conecta directamente con instituciones financieras para la sincronización automática de datos,
            pero esta es una característica que podríamos explorar en el futuro. Toda la información financiera es ingresada manualmente por el usuario.
            </p>

            <h2>3. Elegibilidad y Creación de Cuenta</h2>
            <p>
            Debes tener al menos 18 años para usar los Servicios. Al crear una cuenta, te comprometes a proporcionar información precisa,
            actual y completa. Eres responsable de mantener la confidencialidad de tu contraseña y cuenta, y eres
            totalmente responsable de todas las actividades que ocurran bajo tu cuenta. Notifícanos inmediatamente a {supportEmail} sobre
            cualquier uso no autorizado de tu cuenta o cualquier otra violación de seguridad.
            </p>

            <h2>4. Uso de los Servicios</h2>
            <p>
            Te comprometes a usar los Servicios solo para fines lícitos y de acuerdo con estos Términos. Acuerdas no usar los Servicios:
            </p>
            <ul>
            <li>De cualquier manera que viole cualquier ley o regulación local, nacional o internacional aplicable.</li>
            <li>Con el propósito de explotar, dañar o intentar explotar o dañar a menores de cualquier manera exponiéndolos a contenido inapropiado o de otra manera.</li>
            <li>Para transmitir o procurar el envío de cualquier material publicitario o promocional no solicitado o no autorizado, incluyendo cualquier "correo basura", "carta en cadena", "spam" o cualquier otra solicitud similar.</li>
            <li>Para suplantar o intentar suplantar a {companyName}, un empleado de {companyName}, otro usuario o cualquier otra persona o entidad.</li>
            <li>De cualquier manera que infrinja los derechos de otros, o de cualquier manera que sea ilegal, amenazante, fraudulenta o dañina, o en conexión con cualquier propósito o actividad ilegal, fraudulenta o dañina.</li>
            <li>Participar en cualquier otra conducta que restrinja o inhiba el uso o disfrute de los Servicios por parte de cualquier persona, o que, según lo determinemos, pueda dañar o exponer a {companyName} o a los usuarios de los Servicios a responsabilidad.</li>
            </ul>

            <h2>5. Tus Datos y Privacidad</h2>
            <p>
            Nos tomamos muy en serio tu privacidad. Nuestra recopilación y uso de información personal en relación con tu acceso y uso
            de los Servicios se describe en nuestra <Link to="/privacy">Política de Privacidad</Link>. Tú eres el propietario de tus datos financieros
            ingresados en la aplicación. {appName} no vende tus datos personales a terceros.
            </p>
            <p>
            Eres responsable de mantener la exactitud de la información que envías, así como de realizar copias de seguridad
            de tus datos si así lo deseas, ya que {appName} podría no ofrecer servicios de copia de seguridad garantizados en todas sus versiones.
            </p>

            <h2>6. Propiedad Intelectual</h2>
            <p>
            Los Servicios y su contenido original (excluyendo el contenido proporcionado por los usuarios), características y funcionalidad son y seguirán siendo
            propiedad exclusiva de {companyName} y sus licenciantes. Los Servicios están protegidos por derechos de autor, marcas registradas y otras leyes
            tanto de [Tu País] como de países extranjeros. Nuestras marcas comerciales y nuestra imagen comercial no pueden utilizarse en relación con ningún producto
            o servicio sin el consentimiento previo por escrito de {companyName}.
            </p>

            <h2>7. Modificaciones al Servicio y Precios (si aplica)</h2>
            <p>
            Nos reservamos el derecho de retirar o modificar nuestros Servicios, y cualquier servicio o material que proporcionemos a través de los Servicios,
            a nuestra entera discreción y sin previo aviso. No seremos responsables si por alguna razón la totalidad o parte de los Servicios
            no está disponible en algún momento o durante algún período.
            </p>
            <p>
            Si {appName} introduce características premium o modelos de suscripción en el futuro, los términos de pago y cualquier tarifa aplicable
            se comunicarán claramente en el momento de la suscripción. Cualquier cambio en las tarifas se notificará con antelación.
            </p>

            <h2>8. Terminación</h2>
            <p>
            Podemos terminar o suspender tu acceso a nuestros Servicios inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo,
            incluyendo, entre otros, si incumples los Términos.
            </p>
            <p>
            Todas las disposiciones de los Términos que por su naturaleza deberían sobrevivir a la terminación sobrevivirán a la terminación, incluyendo,
            sin limitación, las disposiciones de propiedad, las renuncias de garantía, la indemnización y las limitaciones de responsabilidad.
            </p>

            <h2>9. Descargo de Responsabilidad de Garantías</h2>
            <p>
            LOS SERVICIOS SE PROPORCIONAN "TAL CUAL" Y "SEGÚN DISPONIBILIDAD", SIN GARANTÍAS DE NINGÚN TIPO, YA SEAN EXPRESAS O IMPLÍCITAS,
            INCLUYENDO, PERO NO LIMITADO A, GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR, NO INFRACCIÓN
            O CURSO DE DESEMPEÑO.
            </p>
            <p>
            {companyName}, sus subsidiarias, afiliadas y sus licenciantes no garantizan que a) los Servicios funcionarán
            de manera ininterrumpida, segura o disponible en cualquier momento o lugar en particular; b) se corregirán los errores o defectos;
            c) los Servicios están libres de virus u otros componentes dañinos; o d) los resultados del uso de los Servicios
            cumplirán con tus requisitos.
            </p>
            <p>
            {appName} es una herramienta de gestión financiera personal. No proporciona asesoramiento financiero, fiscal o legal.
            Debes consultar con profesionales calificados para obtener dicho asesoramiento.
            </p>

            <h2>10. Limitación de Responsabilidad</h2>
            <p>
            EN NINGÚN CASO {companyName}, NI SUS DIRECTORES, EMPLEADOS, SOCIOS, AGENTES, PROVEEDORES O AFILIADOS, SERÁN RESPONSABLES
            POR CUALQUIER DAÑO INDIRECTO, INCIDENTAL, ESPECIAL, CONSECUENTE O PUNITIVO, INCLUYENDO SIN LIMITACIÓN, PÉRDIDA DE BENEFICIOS,
            DATOS, USO, BUENA VOLUNTAD U OTRAS PÉRDIDAS INTANGIBLES, RESULTANTES DE (i) TU ACCESO O USO O INCAPACIDAD PARA ACCEDER O USAR
            LOS SERVICIOS; (ii) CUALQUIER CONDUCTA O CONTENIDO DE TERCEROS EN LOS SERVICIOS; (iii) CUALQUIER CONTENIDO OBTENIDO DE LOS SERVICIOS;
            Y (iv) ACCESO NO AUTORIZADO, USO O ALTERACIÓN DE TUS TRANSMISIONES O CONTENIDO, YA SEA BASADO EN GARANTÍA, CONTRATO, AGRAVIO
            (INCLUYENDO NEGLIGENCIA) O CUALQUIER OTRA TEORÍA LEGAL, YA SEA QUE HAYAMOS SIDO INFORMADOS O NO DE LA POSIBILIDAD DE DICHO DAÑO,
            E INCLUSO SI SE ENCUENTRA QUE UN RECURSO ESTABLECIDO EN ESTE DOCUMENTO HA FALLADO EN SU PROPÓSITO ESENCIAL.
            </p>

            <h2>11. Ley Aplicable y Jurisdicción</h2>
            <p>
            Estos Términos se regirán e interpretarán de acuerdo con las leyes de [Tu Provincia/Estado, Tu País], sin tener en cuenta
            sus disposiciones sobre conflicto de leyes.
            </p>
            <p>
            Nuestra incapacidad para hacer cumplir cualquier derecho o disposición de estos Términos no se considerará una renuncia a esos derechos.
            Si alguna disposición de estos Términos es considerada inválida o inaplicable por un tribunal, las disposiciones restantes
            de estos Términos permanecerán en vigor. Estos Términos constituyen el acuerdo completo entre nosotros con respecto a nuestros
            Servicios, y reemplazan y sustituyen cualquier acuerdo anterior que pudiéramos haber tenido entre nosotros con respecto a los Servicios.
            </p>

            <h2>12. Cambios a los Términos</h2>
            <p>
            Nos reservamos el derecho, a nuestra entera discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión
            es material, intentaremos proporcionar un aviso de al menos 30 días antes de que los nuevos términos entren en vigor.
            Lo que constituye un cambio material se determinará a nuestra entera discreción.
            </p>
            <p>
            Al continuar accediendo o utilizando nuestros Servicios después de que esas revisiones entren en vigor, aceptas estar sujeto a los términos revisados.
            Si no estás de acuerdo con los nuevos términos, deja de usar los Servicios.
            </p>

            <h2>13. Contáctanos</h2>
            <p>
            Si tienes alguna pregunta sobre estos Términos, por favor contáctanos en:
            <br />
            {supportEmail}
            {websiteUrl && <>
                <br />o visita nuestro sitio web: <a href={websiteUrl} target="_blank" rel="noopener noreferrer">{websiteUrl}</a>
            </>}
            </p>
        </section>
      </div>
    </>
  );
};

export default TermsOfServicePage;