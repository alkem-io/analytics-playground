import * as d3 from 'd3';
import { IData } from '../graph/model/data.interface';
import { IEdge } from '../graph/model/edge.interface';
import { INode } from '../graph/model/node.interface';

import { createMachine } from 'xstate';
import { toDirectedGraph } from '@xstate/graph';

export class LifecycleDataProvider {

  selectedHubID = '';
  machineDef: any = undefined;
  machine: any;
  graph: any;
  state = "";

  constructor() {}

  async loadData(jsonDataFileLocation: string) {
     this.machineDef = await d3.json(jsonDataFileLocation);


     this.machine = createMachine(this.machineDef);
     this.graph = toDirectedGraph(this.machine);
     this.updateState(this.machine.initialState);


    return this.machineDef;
  }

  updateState(newState: string) {
    this.state = newState;
  }


}