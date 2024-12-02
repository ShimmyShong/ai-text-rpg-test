'use client'
import { useEffect, useState } from 'react'
import { EnemyInit, OpponentNPCSpeech } from '@/utils/openai'

const CreateEnemy = () => {
  const [enemies, setEnemies] = useState(null)
  const [userResponse, setUserResponse] = useState('')
  const [messages, setMessages] = useState([])
  const handleCreateClick = async () => {
    const createEnemy = await EnemyInit()
    setEnemies(createEnemy)
    setMessages([])
  }

  const handleSpeechClick = async (input) => {
    const createSpeech = await OpponentNPCSpeech(input, userResponse, messages)
    const { messagesArray } = createSpeech;
    setMessages(messagesArray)
  }

  return (
    <div className="m-16 space-y-8">
      {/* Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCreateClick}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          CLICK ME
        </button>
      </div>

      {/* Enemies List */}
      <div className="space-y-8">
        {enemies ? enemies.map((enemy, index) => (
          <div
            key={index}
            className="p-6 bg-gray-100 rounded-lg shadow-md space-y-4"
          >
            {/* Enemy Info */}
            <div className="space-y-2">
              <p className="text-lg font-bold text-gray-800">NAME: <span className="font-normal">{enemy.name}</span></p>
              <button
                onClick={() => handleSpeechClick(enemy)}
                className='px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition'>
                Create Speech
              </button>
              <input type="text" value={userResponse} onChange={(e) => setUserResponse(e.target.value)} />
              <p className="text-gray-700">DESCRIPTION: {enemy.description}</p>
              <p className="text-gray-700">MHP: {enemy.mhp}</p>
              <p className="text-gray-700">ATK: {enemy.atk}</p>
              <p className="text-gray-700">MAT: {enemy.mat}</p>
              <p className="text-gray-700">DEF: {enemy.def}</p>
              <p className="text-gray-700">MDF: {enemy.mdf}</p>
              <p className="text-gray-700">AGI: {enemy.agi}</p>
            </div>

            {/* Skills */}
            {enemy.skills && enemy.skills.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-gray-800 font-semibold">Skills:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {enemy.skills.map((skill, skillIndex) => (
                    skill.name ? (
                      <li key={skillIndex} className="text-gray-700">
                        <p>SKILL NAME: {skill.name}</p>
                        <p>SKILL ATTACK MULTIPLIER: {skill.atkMult}</p>
                        <p>SKILL TYPE: {skill.type}</p>
                        {skill.description ? <p>SKILL DESCRIPTION: {skill.description}</p> : null}
                      </li>
                    ) : null
                  ))}
                </ul>
              </div>
            )}

            {/* Ultimate Skill */}
            {enemy.ultimateSkill && enemy.ultimateSkill.name ? (
              <div className="text-gray-800">
                <span className="font-bold">ULTIMATE SKILL:</span> {enemy.ultimateSkill.name}, MULTIPLIES ATTACK BY {enemy.ultimateSkill.atkMult}, DELAYS {enemy.ultimateSkill.turnDelay} TURNS.
                <div>ULT SKILL DESCRIPTION: {enemy.ultimateSkill.description}</div>
              </div>
            ) : null}

          </div>
        )) : (
          <p className="text-gray-500 text-center">No enemies found.</p>
        )}
      </div>
    </div>
  )
}

export default CreateEnemy
