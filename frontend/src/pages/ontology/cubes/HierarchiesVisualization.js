import React from 'react';
import Graph from 'react-graph-vis';
import vis from 'vis-network';
import 'vis-network/styles/vis-network.css';

export default class HierarchyVisualization extends React.Component {
  
  state = {
    nodes:[],
    edges:[],
    containerStyle:null,
    graphOptions:null
  }

  componentDidMount() {
    console.log(this.props.nodesHier)
    this.setGraph()
    this.setNodesEdges(this.props.nodesHier)
  }


  setGraph = () => {
    this.state.graphOptions = {
      layout: {
        hierarchical: {
          direction: "LR", // Left to Right layout
          sortMethod: "directed", // Sort nodes based on edge directions
          levelSeparation: 200, // Adjust this value to control the level separation
          nodeSpacing: 200, // Adjust this value to control the node spacing
        },
      },
      edges: {
        color: '#FC9E4F',
      },
      nodes:{
        color: '#14202B',
        shape: 'circle',
        font: {
          color: '#ffffff',
          size: 13,
          bold: {
            mod: 'bold',
          },
          align: 'center', // Align the text in the center
        }
      }
    };
  
    // Set the container style for the graph
    this.state.containerStyle = {
      width: '1000px',
      height: '1000px',
    };
  }

  setNodesEdges = (nodesHier) => {
    let nodes = [];
    let edges = [];
    nodesHier.forEach(pair => {
      const [from, to] = pair;
      
      // Check if nodes already exist before adding
      const fromNode = { id: from, label: from };
      if (!nodes.some(node => node.id === fromNode.id)) {
        nodes.push(fromNode);
      }
      
      const toNode = { id: to, label: to };
      if (!nodes.some(node => node.id === toNode.id)) {
        nodes.push(toNode);
      }
      
      edges.push({ from, to });
    });
    this.setState({nodes:nodes,edges:edges})
  }

  render() {
    return (
      <div style={this.state.containerStyle}>
        <Graph graph={{ nodes:this.state.nodes, edges:this.state.edges }} options={this.state.nodesgraphOptions} />
      </div>
    );
  }
}