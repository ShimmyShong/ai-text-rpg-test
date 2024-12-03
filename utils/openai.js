const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const z = require("zod");
const { DoesNPCRun } = require('../utils/gemini')

const openai = new OpenAI({ apiKey: "key here", dangerouslyAllowBrowser: true });

const RandomOpponentCreation = z.object({
  name: z.string(),
  description: z.string(),
  mhp: z.number(),
  atk: z.number(),
  mat: z.number(),
  def: z.number(),
  mdf: z.number(),
  agi: z.number(),
  skills: z.array(z.object({
    name: z.string(),
    atkMult: z.number().describe('Must be at least 1.1; Can be up to 4.0'),
    type: z.enum(['Physical', 'Special'])
  })).describe('Enemies can have up to 6 skills'),
  ultimateSkill: z.object({
    name: z.string(),
    atkMult: z.number().describe('At least 5.0; Can be up to 15.0'),
    description: z.string(),
    turnDelay: z.number()
  }).nullable()
});

const EnemyInit = async (environment, encounter) => {
  const startTime = performance.now()
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        "role": "system",
        "content": `
          You are an expert in creating unique, random opponent encounters for a fantasy game. Not all opponent encounters can be dangers or casual brawls; consider the environmental context. Human/Human-like, or creatures, or ephemeral beings should all be considered.
          Each encounter should only include a single entity, include their personal name by your discretion. Skill amounts should be lower and weaker with lower threat levels, and Ultimate Attacks shouldn't exist below a Threat Level of 2,500.

          **Naming and Description Conventions by Threat Level:

          1. Threat Levels 1–100: Simple, unassuming names; encounters pose minimal threat.
          2. Threat Levels 101–400: Slightly distinctive names indicating minor threats.
          3. Threat Levels 501–2,000: Noticeable names suggesting small challenges.
          4. Threat Levels 2,001–3,500: Strong names hinting at moderate danger.
          5. Threat Levels 3,501–5,000: Descriptive names implying capable adversaries.
          6. Threat Levels 5,001–7,000: Impressive names denoting significant power.
          7. Threat Levels 7,001–10,000: Grandiose names suggesting high-level threats.
          8. Threat Levels 10,001–15,000: Majestic names indicating formidable opponents.
          9. Threat Levels 15,001–25,000: Epic names denoting dangerous and powerful entities.
          10. Threat Levels 25,001–40,000: Legendary names implying near-mythical threats.
          11. Threat Levels 40,001–65,000: Mythical and long names suggesting god-like powers.
          12. Threat Levels 65,001–100,000: Catastrophic names representing apocalyptic dangers.

          **Context:**

          - Environment: The Quiet Hearth Village: Nestled in a fertile valley surrounded by rolling hills, the Quiet Hearth Village is a peaceful community of farmers, artisans, and traders. Cobblestone streets wind through the village, lined with quaint thatched-roof cottages and colorful market stalls. A large oak tree stands in the village square, its branches stretching wide, offering shade to villagers who gather there to socialize or trade goods. The air is filled with the scent of fresh bread from the bakery and the gentle hum of daily life.
          ${encounter ? `- Encounter Situation: ${encounter}` : null}
          - Threat Level: 120
  `
      }
    ],
    response_format: zodResponseFormat(RandomOpponentCreation, "opponent_encounter"),
    temperature: 1.1
  });
  const events = completion.choices.map(choice => choice.message.parsed)
  const event = completion.choices[0].message.parsed;
  const endTime = performance.now()
  console.dir(events, { depth: null });
  console.log(`Prompt Tokens: ${completion.usage.prompt_tokens}, Completion Tokens: ${completion.usage.completion_tokens}`)
  console.log(endTime - startTime)
  return events
}

// TODO: Opponents will sometimes announce their next attacks, make a function that detects this during the battle and ensures they use that attack next.
const OpponentNPCSpeech = async (opponent, userResponse, messagesArray) => {
  if (userResponse) {
    messagesArray.push({
      role: "user",
      content: userResponse
    })
  }
  const startTime = performance.now()
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
          You are the following NPC ${JSON.stringify({
          name: opponent.name, description: opponent.description
        })}.
        You must stay in character and respond only as this NPC would in the context of the game world. Your responses should:

        1. **Be BRIEF**:
          - For characters capable of speech (e.g., humans, undead skeletons): Respond in **one or two sentences maximum**.
          - For non-verbal characters (e.g., zombies, plants, wisps): Respond with **only sounds**, formatted using asterisks (e.g., *groan*, *hiss*, *swish*).

        2. **Formatting Rules**:
          - **DO NOT** use asterisks (*) unless your character's response is non-verbal (e.g., zombie groans or plant noises).
          - Characters capable of speech (e.g., undead skeletons) must speak in plain text, without asterisks.

        3. **Avoid Descriptive or Atmospheric Text**:
          - Do not include actions, scenery, or internal states unless explicitly asked.
          - Examples:
            - Zombies: *groan*, *snarl*.
            - Wisps: *whisper...*, *spspss...*.
            - Plants: *swish*, *hum...*.
            - Animals: *growl*, *chirp*.
            - Skeletons capable of speech: Plain text, such as "I hunger for souls." (just an example)

        4. **Immersion Rules**:
          - Respond strictly within character, avoiding verbosity, embellishments, or out-of-context explanations.

        5. **Speech Bubble Constraints**:
          - Your response will be displayed in a speech bubble. Keep it concise, appropriate for the character, and free of unnecessary symbols or formatting.

        Respond as your character now, strictly adhering to these rules. Remember this you are in a battle
        Here is the context of the ongoing battle dialogue:
          `
        ,
      }, ...messagesArray
    ],
  });
  const event = completion.choices[0].message.content;
  const endTime = performance.now()
  // console.log(messagesArray)
  console.log(event)
  if (userResponse) await DoesNPCRun(event, userResponse)
  console.log(`Prompt Tokens: ${completion.usage.prompt_tokens}, Completion Tokens: ${completion.usage.completion_tokens}`)
  console.log(endTime - startTime)
  messagesArray.push({
    role: "assistant",
    content: event
  })
  return { event, messagesArray }
}

const MainChat = async (userResponse, messagesArray) => {
  try {
    if (userResponse) {
      messagesArray.push({
        role: "user",
        content: userResponse
      })
    }
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
          You are an expert at controlling this text-based RPG. The player must interact with the world through their character's abilities and handle the situations presented to them. The player cannot arbitrarily dictate changes to the world, environment, or context but may naturally explore the world through their actions.

Present the current setting and allow the player to interact with it freely. Keep responses BRIEF, especially for straightforward questions (e.g., "no gold?"). Provide concise answers in 1 sentence or less unless the player explicitly asks for detailed explanations. 

When the player expresses intent (e.g., finding a village), guide them naturally through exploration without assuming immediate outcomes. Let discoveries happen step-by-step and avoid skipping ahead.

If the player attempts something beyond their abilities, explain why it isn't possible briefly and consistently. Start by asking for the player’s name and race, then place them in a situation they must address.
 `
        }, ...messagesArray
      ],
      temperature: 1.2
    })

    const event = completion.choices[0].message.content
    console.log(completion.usage.prompt_tokens_details.cached_tokens)
    console.log(`Prompt Tokens: ${completion.usage.prompt_tokens}, Completion Tokens: ${completion.usage.completion_tokens}`)
    messagesArray.push({
      role: "assistant",
      content: event
    })
    return { event, messagesArray }
  } catch (err) {
    console.error(err)
  }
}

module.exports = { EnemyInit, OpponentNPCSpeech, MainChat }