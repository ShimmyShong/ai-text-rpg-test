const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI("key");

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    // npc_intent: {
    //   type: SchemaType.STRING,
    //   description: 'What is their intent and why'
    // },
    npc_leave_battle_state: {
      type: SchemaType.BOOLEAN,
      description: 'This must be true if the NPC is talking about surrendering or talking about doing something that will make the player and npc leave the battle state.'
    }
  },
  required: ["npc_leave_battle_state"],
}

const battleSchema = {
  type: SchemaType.OBJECT,
  properties: {
    enter_battle_state: {
      type: SchemaType.BOOLEAN,
      description: 'This must be true if the NPC is talking about doing something that will make the player and npc enter the battle state.'
    }
  },
  required: ["enter_battle_state"],
}


const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-8b-001",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema
  }
});

const battleModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-8b-001",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: battleSchema
  }
});

const testModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b-001' })

const DoesNPCRun = async (prompt, userResponse) => {
  try {
    const npcMessageAnalysisPrompt = `
      You are analyzing the intent of an NPC during a battle state. Based on their dialogue, determine the following:
      
      1. **npc_intent**: Describe the NPC's intent and reasoning. This should explain whether the NPC is running, surrendering, or trying to negotiate (e.g., offering a truce, suggesting collaboration), and why.

      2. **npc_leave_battle_state**: Return 'true' if the NPC is talking about surrendering, running, or suggesting anything that would lead to leaving the battle state. Return 'false' otherwise.

      3. ENSURE THAT YOU'RE UNDERSTANDING THAT ANYTHING THAT INVOLVES THEM TALKING ABOUT MOVING ONTO SOMETHING THATS NOT BATTLING SHOULD RETURN TRUE, **MAKE SURE ITS FAIRLY EXPLICIT THAT THEY'RE FINISHED BATTLING THOUGH**

      Keep in mind that collaboration, truces, or pauses in fighting (even temporarily) should result in 'true' for npc_leave_battle_state.

      ${userResponse ? `Player Message: ${userResponse}` : null}
      NPC Message: ${prompt}
    `;

    const result = await model.generateContent(npcMessageAnalysisPrompt);

    console.log(result.response.text());
    console.log(`Input tokens: ${result.response.usageMetadata.promptTokenCount}, Output tokens: ${result.response.usageMetadata.candidatesTokenCount}`);
  } catch (err) {
    console.error(err);
  }
};

const DoesNPCBattle = async (prompt, userResponse) => {
  try {
    const npcMessageAnalysisPrompt = `
      You are analyzing the dialogue between a player and an NPC to determine whether they are preparing to enter a battle state. Carefully analyze their messages and intent, focusing on the following:

      1. **npc_intent**: Describe the NPC's intent and reasoning. Explain whether the NPC is showing hostility, defending themselves, threatening the player, or escalating toward a battle state. If the NPC is trying to avoid a fight, explain why.

      2. **enter_battle_state**: Return 'true' if the dialogue indicates that the NPC and/or the player are escalating toward a fight or preparing to engage in combat. Examples:
        - Threats from the NPC or player (e.g., "You leave me no choice!", "Prepare yourself!")
        - Clear hostility (e.g., insults, provocation, or declarations of attack).
        - Defensive or retaliatory behavior (e.g., "I won't back down!", "I'll protect myself if I have to!").
        Return 'false' if the dialogue indicates an effort to avoid a fight, de-escalate the situation, or maintain peace.

      3. **Key Notes**:
        - Consider both the player's and NPC's messages in your analysis.
        - If either message clearly shows an attempt to **de-escalate** (e.g., offering a truce, backing off, apologizing), return 'false' for enter_battle_state.
        - If both sides remain neutral or non-hostile, assume 'false' unless hostility is explicitly shown.

      Player Message: ${userResponse}
      NPC Message: ${prompt}
`;


    const result = await battleModel.generateContent(npcMessageAnalysisPrompt);

    console.log(result.response.text());
    console.log(`Input tokens: ${result.response.usageMetadata.promptTokenCount}, Output tokens: ${result.response.usageMetadata.candidatesTokenCount}`);
    return result.response.text()
  } catch (err) {
    console.error(err);
  }
};

// attempt to replicate OpponentNPCSpeech in openai.js, sucks very much with gemini flash
const GeminiNPCSpeech = async (opponent, userResponse, messagesArray) => {
  if (userResponse) {
    messagesArray.push({
      role: "user",
      content: userResponse
    })
  }
  const startTime = performance.now()
  const result = await testModel.generateContent(`
You are the following NPC:
${JSON.stringify({ name: opponent.name, description: opponent.description, type: opponent.type })}.

            As this NPC, you must respond strictly in character, adhering to the rules based on your type (${opponent.type}):

            1. **Behavior Rules by Type:**
              - **Humans:** Speak in brief, natural sentences. Responses should be no more than one or two sentences.
                - Example: "Leave this place!" or "I will protect the village."
              - **Zombies:** Respond with guttural, non-verbal sounds like *groan*, *snarl*, or *hiss*. Do not use words or coherent sentences.
                - Example: "*Groan...*" or "*Snarl!*"
              - **Wisps:** Use fragmented phrases, whispers, or eerie sounds like *whisper*, *hiss*, or cryptic fragments (e.g., *lost...*, *forever...*).
                - Example: "*Hiss...*", "*Whisper... lost...*"
              - **Plants:** Respond only with non-verbal noises like *swish*, *hum...*, or *rustle*. Avoid any words or implied sentience.
                - Example: "*Rustle...*" or "*Hum...*"
              - **Animals:** Use animalistic sounds like *growl*, *roar*, *chirp*, or *snarl*. Do not form words or human-like phrases.
                - Example: "*Growl!*" or "*Chirp...*"

            2. **General Rules:**
              - Be **BRIEF**:
                - Humans: Maximum of one or two sentences.
                - Non-speaking NPCs (zombies, wisps, plants, animals): One or two words or sounds.
              - Avoid all descriptive or atmospheric text:
                - Do not describe actions, scenery, or internal states unless explicitly requested in the context.
              - Stay within the limits of your NPC type. Do not break immersion or respond in ways inconsistent with your role.

            3. **Speech Bubble Constraints:**
              - Your response will appear in a speech bubble. Keep it concise and appropriate for the character.

            Here is the context of the ongoing dialogue:
            ${JSON.stringify(messagesArray)}

            Respond as your character now, strictly adhering to these rules.
`
  )
  const event = result.response.text();
  const endTime = performance.now()
  console.log(messagesArray)
  console.log(event)
  console.log(`Input tokens: ${result.response.usageMetadata.promptTokenCount}, Output tokens: ${result.response.usageMetadata.candidatesTokenCount}`)
  console.log(endTime - startTime)
  messagesArray.push({
    role: "assistant",
    content: event
  })
  return { event, messagesArray }
}

const GeminiChat = async (userResponse, messagesArray) => {
  if (userResponse) {
    messagesArray.push({
      role: "user",
      content: userResponse
    })
  }
  const startTime = performance.now()
  const result = await testModel.generateContent(`You are an expert at controlling this text-based RPG.Allow the player to interact with the world and pursue their goals within their character's abilities. Respond only to their actions or questions. 

                    Do NOT suggest what they should do next, and keep responses concise unless the player specifically asks for detailed descriptions or explanations.Only provide environmental narration when it is directly relevant to the player's actions. 

                    If something is beyond their abilities, acknowledge it briefly and maintain consistency in the game world.Keep the tone engaging but avoid unnecessary elaboration unless prompted by the player.Now ask the player for their name and race, and introduce them to their new beginnings after for your first message.

                    Message History: ${JSON.stringify(messagesArray)}
`
  )
  const event = result.response.text();
  const endTime = performance.now()
  console.log(messagesArray)
  console.log(event)
  console.log(`Input tokens: ${result.response.usageMetadata.promptTokenCount}, Output tokens: ${result.response.usageMetadata.candidatesTokenCount}`)
  console.log(endTime - startTime)
  messagesArray.push({
    role: "assistant",
    content: event
  })
  return { event, messagesArray }
}

const EncounterSummarize = async (messagesArray) => {
  const result = await testModel.generateContent(`
  The context for the summarization you're supposed to create is for an text based RPG.
  Now, here are the last few messages between the player and the game that lead to them to go into a battle state, create a summary based on it:
  ${JSON.stringify(messagesArray.slice(-6))}
  `)

  const event = result.response.text();
  console.log(event)
}

module.exports = { DoesNPCRun, DoesNPCBattle, GeminiChat, EncounterSummarize }