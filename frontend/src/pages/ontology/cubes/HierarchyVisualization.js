import React, { Component } from 'react';
import Graph from 'react-graph-vis';
import vis from 'vis-network';
import 'vis-network/styles/vis-network.css';

class HierarchyVisualization extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      edges: [],
    };
  }

  resetGraph() {
    this.setState({
      nodes: [],
      edges: [],
    });
  }

  componentDidMount() {
    // Initialize the graph when the component mounts
    this.updateGraph(this.props.nodesHier);
  }

  componentDidUpdate(prevProps) {
    if (this.props.nodesHier !== prevProps.nodesHier) {
      // Update the graph when nodesHier prop changes
      this.updateGraph(this.props.nodesHier);
    }
  }

  updateGraph(nodesHier) {
    // Create nodes and edges based on nodesHier
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

    // Update the component state with new nodes and edges
    this.setState({ nodes, edges });
  }

  render() {
    const graphOptions = {
      layout: {
        hierarchical: {
          direction: "LR", // Left to Right layout
          sortMethod: "directed", // Sort nodes based on edge directions
          levelSeparation: 100, // Adjust this value to control the level separation
          nodeSpacing: 100, // Adjust this value to control the node spacing
          edgeMinimization: true, // Minimize edge length
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

    const containerStyle = {
      width: '500px',
      height: '400px', // Limit the height and enable vertical scrolling
    };

    return (
      <div style={containerStyle}>
        <Graph graph={{ nodes: this.state.nodes, edges: this.state.edges }} options={graphOptions} />
      </div>
    );
  }
}

export default HierarchyVisualization;
