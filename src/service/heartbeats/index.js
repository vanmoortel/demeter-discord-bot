import HeartBeats from 'heartbeats'
import logger from "../winston/index.js"

export const FIVE_MIN = 300000

const createHeartBeats = (
    heartBeatName='heartbeats',
    heartRate=FIVE_MIN,
    events=[{modulo: 1, func: () => logger.info('check')}]
) => {
    try {
        HeartBeats.killHeart(heartBeatName)

        const heartBeat = HeartBeats.create(heartRate, heartBeatName)
        for (const event of events) {
            heartBeat.createEvent(event.modulo, event.func)
        }
    } catch (e) {
        logger.error(e)
        return null
    }
}