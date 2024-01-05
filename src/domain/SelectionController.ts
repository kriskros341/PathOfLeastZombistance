import { StateController } from "./StateController";

type State = {
  selection: string[]
}

type SelectionStrategy = <T>(data: T) => string[];

class SelectionController extends StateController<State> {
    strategy?: SelectionStrategy;
    setStrategy = (strategy: SelectionStrategy) => {
      this.strategy = strategy;
      return this;
    }
    execute(data: any) {
      return this.strategy?.(data) ?? [];
    }
}

export default SelectionController