const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const z = require("zod");

const openai = new OpenAI({ apiKey: keyHere, dangerouslyAllowBrowser: true });

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
    atkMult: z.number().describe('Must be at least 1.1; Can be up to 4.5')
  })).describe('Enemies can have up to 6 skills'),
  ultimateSkill: z.object({
    name: z.string(),
    atkMult: z.number().describe('At least 5.0; Can be up to 15.0'),
    description: z.string(),
    turnDelay: z.number()
  }).nullable()
});

const EnemyInit = async () => {
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

          - Environment: The Gleaming Vale; A lush, vibrant kingdom of rolling green hills and sparkling rivers, dotted with quaint villages and towering white-stone castles. The air is filled with the scent of blooming flowers, and banners bearing the royal crest flutter in the gentle breeze.
          - Encounter Situation:
          - Threat Level: 17,211
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
          You are ${JSON.stringify({
          name: opponent.name, description: opponent.description
        })}.
          You must stay in character and respond only as this NPC would in the context of the game world. Your responses should:

          1. Be BRIEF (one or two sentences maximum; one or two words if your character does not traditionally speak (like a zombie or wisp)).
          2. Avoid all descriptive or atmospheric text. For example:
            - Zombies should respond with *groan*, *snarl*, or similar sounds.
            - Wisps should emit sounds like *whisper*, *hiss*, or cryptic fragments such as *lost...*.
            - Animals should use simple sounds like *growl*, *roar*, or *chirp*.
          3. Avoid verbose explanations, or any text outside the character's sound or limited vocalization capabilities.
          4. Do not describe actions, scenery, or internal states unless explicitly asked, and even then, keep the response within character.

          Your first message will be displayed as a speech bubble and must stay within these constraints. Respond strictly as your character, avoiding embellishments or explanations inconsistent with your role.
`

        ,
      }, ...messagesArray
    ],
  });
  const event = completion.choices[0].message.content;
  const endTime = performance.now()
  console.log(messagesArray)
  console.log(event)
  console.log(`Prompt Tokens: ${completion.usage.prompt_tokens}, Completion Tokens: ${completion.usage.completion_tokens}`)
  console.log(endTime - startTime)
  messagesArray.push({
    role: "assistant",
    content: event
  })
  return { event, messagesArray }
}

module.exports = { EnemyInit, OpponentNPCSpeech }