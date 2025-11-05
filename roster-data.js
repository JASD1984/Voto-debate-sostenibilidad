/* Datos extraídos de Debate.pdf como respaldo local.
   El script de Google Apps Script sobreescribirá esta información si devuelve la tabla del roster. */
const FALLBACK_ROSTER = [
  {
    name: "Adrián Rebolo García",
    topic: "¿Es justo el precio de los medicamentos innovadores?",
    stance: "Ambos",
    notes: "Contiene argumentos a favor y en contra, sin decantarse por uno."
  },
  {
    name: "Ainhoa Fernández Rodríguez",
    topic: "¿Es justo el precio de los medicamentos innovadores?",
    stance: "En contra",
    notes: "Su presentación ofrece contras."
  },
  {
    name: "Ainhoa Moreno Maroto",
    topic: "¿Deben las farmacéuticas compartir sus patentes en países pobres?",
    stance: "A favor",
    notes: "Defiende que compartir patentes salva vidas y es un derecho."
  },
  {
    name: "Alicia Rodríguez Cwik",
    topic: "¿Es justo el precio de los medicamentos innovadores?",
    stance: "En contra",
    notes: "Argumenta que los medicamentos innovadores tienen precios injustos que excluyen a mucha gente."
  },
  {
    name: "Elena Rivero Esteban",
    topic: "¿Debería permitirse reutilizar medicamentos no caducados devueltos?",
    stance: "En contra",
    notes: "Advierte que la reutilización no garantiza seguridad ni trazabilidad."
  },
  {
    name: "Nerea Sancho Fernández",
    topic: "¿Es justo el precio de los medicamentos innovadores?",
    stance: "A favor",
    notes: "Presenta argumentos favorables al precio actual."
  },
  {
    name: "Cecilia Sevillano Ruiz",
    topic: "¿Reemplazará la inteligencia artificial parte del trabajo de los técnicos de farmacia?",
    stance: "En contra",
    notes: "Destaca que la IA ayuda pero no puede sustituir la empatía humana."
  },
  {
    name: "Marta Torres Serrano",
    topic: "¿Reemplazará la inteligencia artificial parte del trabajo de los técnicos de farmacia?",
    stance: "En contra",
    notes: "Aunque preparó ambos argumentos, indicó en comentarios que su postura es en contra."
  },
  {
    name: "Sara Vega Martínez",
    topic: "¿Reemplazará la inteligencia artificial parte del trabajo de los técnicos de farmacia?",
    stance: "En contra",
    notes: "Defiende que la IA complementa al profesional pero no lo sustituye."
  },
  {
    name: "Carlota Martín Chamero",
    topic: "¿Las farmacias deberían ofrecer servicios básicos gratuitos a colectivos vulnerables?",
    stance: "A favor",
    notes: "Argumenta que la salud es un derecho y se deben ofrecer servicios gratuitos."
  },
  {
    name: "Esther Molina Soriano",
    topic: "¿Las farmacias deberían ofrecer servicios básicos gratuitos a colectivos vulnerables?",
    stance: "A favor",
    notes: "Expone que ayudar a los vulnerables mejora la salud y la reputación de las farmacias."
  },
  {
    name: "Fátima Alcolao Martínez",
    topic: "¿Debería permitirse reutilizar medicamentos no caducados devueltos?",
    stance: "En contra",
    notes: "Afirma que no es seguro reutilizarlos y puede generar resistencias."
  },
  {
    name: "Eva María García Díaz",
    topic: "¿Deben las farmacéuticas compartir sus patentes en países pobres?",
    stance: "En contra",
    notes: "Sostiene que obligar a compartir patentes desincentiva la innovación y no resuelve problemas de infraestructura."
  },
  {
    name: "María González Gallego-Nicasio",
    topic: "Automedicación",
    stance: "En contra",
    notes: "Defiende que la automedicación es un riesgo para la salud."
  },
  {
    name: "Marina Fernández Aceña",
    topic: "¿Debería permitirse reutilizar medicamentos no caducados devueltos?",
    stance: "Ambos",
    notes: "Señala ventajas e inconvenientes de la reutilización, sin adoptar una postura firme."
  },
  {
    name: "Patricia García Cabezas",
    topic: "¿Deben las farmacéuticas compartir sus patentes en países pobres?",
    stance: "A favor",
    notes: "Defiende que compartir patentes salva vidas y es un acto de justicia."
  },
  {
    name: "Ruth Flores Cotillo",
    topic: "¿Deben las farmacéuticas compartir sus patentes en países pobres?",
    stance: "A favor",
    notes: "Considera el acceso a los medicamentos un derecho universal y que las farmacéuticas deben compartir patentes."
  },
  {
    name: "Virginia Díaz Naranjo",
    topic: "¿Reemplazará la inteligencia artificial parte del trabajo de los técnicos de farmacia?",
    stance: "En contra",
    notes: "Argumenta que la atención humana es insustituible y la IA debe ser un apoyo."
  },
  {
    name: "Óliver Dominic Paredes Durán",
    topic: "¿Es justo el precio de los medicamentos innovadores?",
    stance: "Ambos",
    notes: "Presentó argumentos a favor y en contra, pero no eligió postura."
  },
  {
    name: "Miriam Pines Navarro",
    topic: "¿Deberían las farmacéuticas reducir envases plásticos aunque aumenten costes?",
    stance: "En contra",
    notes: "Indica que su argumento va en contra de reducir envases."
  }
];
