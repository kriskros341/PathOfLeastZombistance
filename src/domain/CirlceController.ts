import { StateController } from "./StateController";

export type CircleState = {
    cx: number,
    cy: number,
    r: number,
}
export const defaultState: CircleState = {
    cx: 0,
    cy: 0,
    r: 0,
}

class CircleController extends StateController<CircleState> {
    constructor(defaults: Partial<CircleState>) {
        super( {...defaultState, ...defaults} )
    }

    includes(x: number, y: number) {
        return Math.hypot(x - this.state.cx, y - this.state.cy) < this.state.r
    }
}

export default CircleController;