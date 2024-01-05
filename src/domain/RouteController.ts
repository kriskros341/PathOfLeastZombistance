import { StateController } from "./StateController"

type state = {
    from: string,
    to: string,
    paths: string[][]
}
type RouteStrategy = (fromId: string, toId: string) => string[][];

class RouteController extends StateController<state> {
    strategy?: RouteStrategy;
    setStrategy = (strategy: RouteStrategy) => {
      this.strategy = strategy;
      return this;
    }
    execute(fromId: string, toId: string) {
        return this.strategy?.(fromId, toId) ?? [];
    }
}

export default RouteController;