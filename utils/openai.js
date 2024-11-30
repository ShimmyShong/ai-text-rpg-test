import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });

const RandomEnemyCreation = z.object({
  enemyName: z.string(),
  description: z.string(),
  health: z.number(),
  attack: z.number(),
  speed: z.number(),
  items: z.array(z.string()),
  intensity: z.number().describe('Range from 0.001-1,000. Higher if enemy is super strong and whatnot and vice versa.')
});

const init = async () => {
  const startTime = performance.now()
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Create stats for a random enemy." }
    ],
    response_format: zodResponseFormat(RandomEnemyCreation, "enemy_creation"),
  });

  const event = completion.choices[0].message.parsed;
  const endTime = performance.now()
  console.log(endTime - startTime)
  console.log(event)
}

init()