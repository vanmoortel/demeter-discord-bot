import HeartBeats from 'heartbeats'
import logger from '../winston/index.js'

export const FIVE_MIN = 300000

/**
 * Create a HeartBeat
 * @param heartBeatName - HeartBeat name used to kill it
 * @param heartRate - Heart rate
 * @param events - List of events
 * @returns {null}
 */
const createHeartBeat = (
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

export default createHeartBeat