import React from 'react';
import {Input, Button, Form, Select, Modal, Divider, message } from 'antd'
import { postHierarchy} from '../../../api/OntologyApi';
import HierarchyVisualization from './HierarchyVisualization';


export default class HierarchyAdd extends React.Component {

    state = {
        virtualEntities:[],
        virtualEntitiesNames:[],
        formItems:[],
        incrementEdges:0,
        selectedItems:{},
        modalOpen:false,
        disableConfirm:true,
        builtHierarchy:{}
        
    }


    toggleModal = () => {
        this.setState({modalOpen:false})
    }

    handleAddLine = () => {
        const newItem = this.state.formItems.concat({ id: this.state.incrementEdges });
        this.setState({
          formItems: newItem,
          incrementEdges:this.state.incrementEdges+1
        });
      };

    handleRemoveLine = (itemID) => {
        if (this.state.selectedItems[itemID]!=undefined){
            this.state.virtualEntitiesNames.push(this.state.selectedItems[itemID])
        }
        const updatedItems = this.state.formItems.filter((item) => item.id !== itemID);
    
        this.setState({
          formItems: updatedItems,
        },() => console.log(this.state.formItems));
    }
    
    componentDidMount() {
        this.setState({virtualEntities:this.props.VE})
        for(let i=0;i<this.props.VE.length;i++){
            this.state.virtualEntitiesNames.push(this.props.VE[i].entity.name)
        }
        console.log(this.state.virtualEntitiesNames)
    }

    handleSelect = (itemID, data) => {
        // add in ve_name list the previoulsy selected value for this select
        if (this.state.selectedItems[itemID]!=undefined){
            this.state.virtualEntitiesNames.push(this.state.selectedItems[itemID])
        }

        // remove from ve_name list the new selected value
        const updatedNames = this.state.virtualEntitiesNames.filter(item => item !== data);
        this.setState({virtualEntitiesNames:updatedNames})
        this.state.selectedItems[itemID]=data

        console.log(this.state.selectedItems)
    }

    isDAGAndHasOneRoot(edges) {
        // Step 1: Create an adjacency list and in-degrees array
        const adjList = new Map();
        const inDegrees = new Map();
        const nodes = new Set();
        let autoEdge = false;
        // Initialize adjacency list and in-degrees
        edges.forEach(([from, to]) => {
          
          if (from == to) {
            autoEdge=true;
          }

          if (!adjList.has(from)) {
            adjList.set(from, []);
          }
          adjList.get(from).push(to);
      
          // Initialize in-degrees
          inDegrees.set(from, (inDegrees.get(from) || 0));
          inDegrees.set(to, (inDegrees.get(to) || 0) + 1);
      
          // Add nodes to the set
          nodes.add(from);
          nodes.add(to);
        });

        if (autoEdge){
            return false;
        }
      
        // Step 2: Count the number of roots (nodes with in-degree 0)
        let rootCount = 0;
        let root = null;
        for (const node of nodes) {
          if (inDegrees.get(node) === 0) {
            rootCount++;
            root = node;
          }
          if (rootCount > 1) {
            // More than one root node found
            return false;
          }
        }
      
        if (rootCount === 0) {
          // No root node found
          return false;
        }
      
        // Step 3: Perform a depth-first search to check for cycles
        const visited = new Set();
      
        function hasCycle(node) {
          visited.add(node);
      
          if (adjList.has(node)) {
            for (const neighbor of adjList.get(node)) {
              if (visited.has(neighbor) || hasCycle(neighbor)) {
                return true;
              }
            }
          }
      
          visited.delete(node);
          return false;
        }
      
        if (hasCycle(root)) {
          // Cycle detected
          return false;
        }
      
        // If there are no cycles and exactly one root, it's a DAG
        return true;
    }
      

    handleSubmit = (values) => {
        let hier_edges = [];
        let check_graph = [];
        let nodes = [];
        for(let i = 0; i < values.dynamic.length;i++){
            if (values.dynamic[i]!= undefined){
                hier_edges.push(values.dynamic[i])
                check_graph.push([values.dynamic[i]["input1"],values.dynamic[i]["input2"]])
                if (!nodes.includes(values.dynamic[i]["input1"])){
                    nodes.push(values.dynamic[i]["input1"])
                }
                if (!nodes.includes(values.dynamic[i]["input2"])){
                    nodes.push(values.dynamic[i]["input2"])
                }
            }
        }

        const isDAG = this.isDAGAndHasOneRoot(check_graph);

        if (isDAG) {
            this.state.disableConfirm = false
        } else {
            message.warn(<div>Wrong Hierarchy <br/> It either contains a cycle or there are more than one source edge</div>)
            this.state.disableConfirm = true
        }


        this.setState({
            builtHierarchy:{
                name:values.HierarchyName,
                description:values.description,
                signature:hier_edges,
                nodes:nodes
            },
            modalOpen:true,
            modalHierarchies:<HierarchyVisualization nodesHier={check_graph} />
        })
    }

    submitConfirm= () => {
        postHierarchy(
            this.props.match.params.ontologyName,
            decodeURIComponent(this.props.match.params.ontologyVersion),
            this.state.builtHierarchy,
            () => {
              window.location.reload()
              
            }
          )
        this.setState({modalOpen:false},() => {
            this.props.close()
        })
        
    }

    render() {
        return(
            <div>
            <Form layout="vertical" onFinish={this.handleSubmit} ref={this.formRef}>
                <Form.Item name="HierarchyName" label="Hierarchy Name" rules={[{ required: true }]}>
                <Input placeholder="Hierarchy Name" />
                </Form.Item>
                <Form.Item name="description" label="Description">
                <Input.TextArea />
                </Form.Item>
                <Divider orientation="left" plain>
                    Add Hierarchy Edge
                </Divider>
                {this.state.formItems.map((item) => (
                <div key={item.id}>
                    <div style={{ width: '30%',display: 'inline-block',marginRight:'3%' }}>
                        <Form.Item name={['dynamic', item.id, 'select']} label="Virtual Entity" rules={[{ required: true }]}>
                            <Select onChange={(selectedOption) => this.handleSelect(item.id, selectedOption)}>
                                {this.state.virtualEntitiesNames.map((option) => (
                                <Select.Option key={option} value={option}>
                                    {option}
                                </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                    <div style={{ width: '25%',display: 'inline-block',marginRight:'3%' }}>
                        <Form.Item name={['dynamic', item.id, 'input1']} label="Source" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </div>
                    <div style={{ width: '25%',display: 'inline-block',marginRight:'3%' }}>
                        <Form.Item name={['dynamic', item.id, 'input2']} label="Destination" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </div>
                    <div style={{ width: '7%',display: 'inline-block' }}>
                        <Form.Item name={['dynamic--'+ item.id+'--button']} label="remove">
                            <Button shape='circle' onClick={() => this.handleRemoveLine(item.id)}>-</Button>
                        </Form.Item>
                    </div>
                </div>
                ))}

                {this.state.formItems.length<this.state.virtualEntities.length?
                <Button shape='circle' onClick={this.handleAddLine}>+</Button>:null}
                

                <Form.Item style={{ textAlign: 'center' }}>
                <Button onClick={this.props.close} style={{ marginRight: 8 }}>
                    Cancel
                </Button>
                <Button htmlType="submit" type="primary" disabled={this.state.formItems.length < 1}>
                    Save
                </Button>
                </Form.Item>
            </Form>

            <Modal
                title={"Do you confirm the hierarchy?"}
                visible={this.state.modalOpen}
                onCancel={this.toggleModal}
                destroyOnClose
                footer={
                    <div>
                        <Button onClick={this.toggleModal} style={{ marginRight: 8 }}>
                            Cancel
                        </Button>
                        <Button htmlType="submit" type="primary" disabled={this.state.disableConfirm} onClick={this.submitConfirm}>
                            Confirm
                        </Button>
                    </div>
                }
              >
                {this.state.modalHierarchies}
            </Modal>
            </div>

        );

    }

}