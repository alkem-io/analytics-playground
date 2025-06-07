import { json } from 'd3-fetch';
import * as d3 from 'd3';

import { createMachine } from 'xstate';
import { toDirectedGraph } from '@xstate/graph';

export class LifecycleDataProvider {

  selectedSpaceID = '';
  machineDef: any = undefined;
  machine: any;
  graph: any;
  state = "";

  constructor() {}

  async loadData(jsonDataFileLocation: string) {
     this.machineDef = await json(jsonDataFileLocation);


     this.machine = createMachine(this.machineDef);
     this.graph = toDirectedGraph(this.machine);
     this.updateState(this.machine.initialState);


    return this.machineDef;
  }

  updateState(newState: string) {
    this.state = newState;
  }


}