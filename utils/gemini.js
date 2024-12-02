const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(useKey);

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    npc_intent: {
      type: SchemaType.BOOLEAN
    }
  },
  required: ["npc_intent"],
}




const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-8b-001",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema
  }
});

const testModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b-latest' })

const DoesNPCRun = async (prompt) => {
  try {
    const result = await model.generateContent(`check if the npc wants to run or surrender (true if running/surrendering, false otherwise) Drothberg: you've bested me! i shall surrender!`);
    console.log(result.response.text())
    console.log(`Input tokens: ${result.response.usageMetadata.promptTokenCount}, Output tokens: ${result.response.usageMetadata.candidatesTokenCount}`)
  } catch (err) {
    console.error(err)
  }
}

const DoesNPCRun2 = async (prompt) => {
  try {
    const result = await testModel.generateContent(`Return true or false whether the NPC wants to run or surrender (true if yes false if no). Drothberg: you've bested me! i shall surrender!`);
    console.log(result.response.text())
    console.log(`tokens: ${result.response.usageMetadata.promptTokenCount}`)
  } catch (err) {
    console.error(err)
  }
}

DoesNPCRun()