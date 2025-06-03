import React from 'react';
import { ThunderboltOutlined, DeleteOutlined,DownloadOutlined} from '@ant-design/icons';
import { BsInfoCircle } from "react-icons/bs";
import { FaWindowClose } from "react-icons/fa";
import { Card, List, Divider, Tooltip, Popconfirm, Input, Button, Drawer, Form, Checkbox, Spin, Select, Popover, Table, message } from 'antd'
import { postDerivedCube, getCube, getHierarchies, getCubes, deleteDerivedCube, getDerivedCube, getVirtualEntities, getDerivedCubes } from '../../../api/OntologyApi';
import { getMastroEndpointsRunning, startNewQuery, getQueryResults, getQueryStatus, downloadQueryResults } from '../../../api/EndpointApi';
import ListDerivedCubeItem from '../../components/ListDerivedCubeItems';
import { PlusOutlined,} from '@ant-design/icons'
import { saveFileInfo } from '../../../utils/utils';
import SearchPath from './SearchPath'
import HierarchyVisualization from './HierarchyVisualization';



export default class CubeHandlePage extends React.Component {
    formRefOper = React.createRef();
    formRefHier = React.createRef();
    searchPathInstance = new SearchPath();
  
    interval = 0;
  
    state = {
        loading:false,
        cube:null,
        showing_table:false,
        readyNum:0,
        pagination: {
            current: 1,
            pageSize: 10,
            total:0,
            showSizeChanger: true,
          },
        addCubeDerived:false,
        hierarchies:{},
        clickedMeasures:[],
    }

    componentDidMount(){
        this.getDataCube()        
    }

    componentDidUpdate(prevProps) {
        if (prevProps.cube !== this.props.cube) {
          this.getDataCube()
        }
    }

    getDataCube() {
        this.setState({loading: true,  })
        getMastroEndpointsRunning((ep) => {
            this.setState({endpoints:ep})
        })

        getDerivedCube(
            this.props.match.params.ontologyName,
            decodeURIComponent(this.props.match.params.ontologyVersion),
            this.props.cube,
            this.loaded
        );
    }

    loaded = (cube) => {
      const cubeMeas = cube.measures.filter(item => item[1]!==null)
      this.setState({cube:cube, cubeMeasures:cubeMeas,loading:false,showing_table:false})
      getCubes(
        this.props.match.params.ontologyName,
        decodeURIComponent(this.props.match.params.ontologyVersion),
        (data) => {
          this.setState({baseCubeList:data})
          const cubes = Object.keys(data)
          if(cubes.includes(cube.baseDataCube)){
            getCube(
              this.props.match.params.ontologyName,
              decodeURIComponent(this.props.match.params.ontologyVersion),
              cube.baseDataCube,
              (data) => {
                this.setState({baseDataCube:data})
              }
            )
          }
          else{
            getDerivedCube(
              this.props.match.params.ontologyName,
              decodeURIComponent(this.props.match.params.ontologyVersion),
              cube.baseDataCube,
              (data) => {
                this.setState({baseDataCube:data})
              }
            )
          }
        }
      )

      getDerivedCubes(
        this.props.match.params.ontologyName,
        decodeURIComponent(this.props.match.params.ontologyVersion),
        (data) => {
          this.setState({derivedCubeList:data})
        }
      )

      
      getHierarchies(
        this.props.match.params.ontologyName,
        decodeURIComponent(this.props.match.params.ontologyVersion),
        (data) => {
            this.setState({hierarchies:data});
        }
      )
      getVirtualEntities(
        this.props.match.params.ontologyName,
        decodeURIComponent(this.props.match.params.ontologyVersion),
        (data) => {
            this.setState({virtualEntities:data});
        }
      )
    }



    handleDropIT = (cube) => {
      deleteDerivedCube(
        this.props.match.params.ontologyName,
        decodeURIComponent(this.props.match.params.ontologyVersion),
        cube,
        (data) => {
          window.location.reload()
          }
      );
    }

    handleDeleteDerivedCube = () => {
      let delArray = [];
      for (let key in this.state.derivedCubeList) {
          if (this.state.derivedCubeList[key]['baseDataCube'] === this.state.cube.name) {
            delArray.push(key);
          }
      }
      
      if(delArray.length===0){
        this.handleDropIT(this.state.cube.name);
      }
      else{
        delArray = delArray.join(', ')
        message.error(<span>This cube cannot be deleted<br/>On this cube are built the cubes:<br/><b>{delArray}</b></span>)
      }
      
  }

    // Running query methods
    
    // Divide the SPARQL code of a virtual entity
    codeDivision = (code) => {
      let sparqlcode = code.split('\n');
      let prefix = [];
      let select = [];
      let where = [];
  
      for (const row of sparqlcode) {
        if (row.startsWith("PREFIX")) {
          prefix.push(row)
        } else if (row.startsWith("SELECT")) {
          select.push(row.split(' ').filter(item => !["SELECT","DISTINCT",""].includes(item)));
        }
      }
  
      let inWhere = false;
  
      // Iterate through the list
      for (const item of sparqlcode) {
        if (item.includes("WHERE")) {
          inWhere = true;
        } else if (inWhere && item.includes("}")) {
          break; // Stop collecting fields when we reach the closing curly brace
        } else if (inWhere) {
          where.push(item.trim().replace(/{/g, '')); // Add items to the 'fields' array
        }
      }
      const categorizedContent = {
        ['prefix']: prefix,
        ['select']: select[0],
        ['where']: where
      };
  
      return categorizedContent;
    }

    splitCode = (sparqlQuery) => {
      let prefix = [];
      let code = []; 


      const sepQuery = sparqlQuery.split('\n');
      for(let line in sepQuery){
        const row = sepQuery[line]
        if (row.startsWith("PREFIX")){
          prefix.push(row);
        }
        else{
          code.push(row)
        }
      }

      code = code.join('\n')

      const queryRegex = /{([\s\S]+)}/;

      const queryMatch = code.match(queryRegex);

      if (!queryMatch) {
        throw new Error("Invalid SPARQL query format");
      }

      const queryBlock = queryMatch[1].trim();

      const result = {
        prefix: prefix,
        where: `WHERE {${queryBlock}}`,
        select: code.substring(0, code.indexOf('{')).trim().split('\n')[0],
        groupBy: code.substring(code.lastIndexOf('}') + 1).trim(),
      };


      return result;
    }

    createCode = (prefixes, select, where, groupby) =>{
      const pref = prefixes.join('\n');
      const sel = '\nSELECT DISTINCT '+select.join(' ')+'\n';
      const wher = 'WHERE {\n'+where+'\n }\n';
      const grby = 'GROUP BY '+groupby.join(' ');

      const cd = pref+sel+wher+grby

      return cd

    }
    
    handleAddDerivedCube = (data) => {
      const dimensionsWOHier = data.dimension;
      const dimensionsWHier = data.dimensions;
      let rollup = [];
      let drilldown = [];
      let measuresCube = [];

      let visitedVE = [];
      let vistitedEdges = {};
      let dimensionHier = [];

      let sel = []
      let grpby = []

      let dimensionsWithHierarchies = {};
      
      let sparqlCode = this.state.cube.sparqlCode;

      for(let key in dimensionsWHier){
        const dimension = dimensionsWHier[key];
        if(dimension.hierarchyDim!==dimension.newHierarchyDimension){
          const edges = this.searchPathInstance.searchPath(
            this.state.hierarchies[dimension.hierarchy]['signature'],
            dimension.hierarchyDim,
            dimension.newHierarchyDimension
          );
          sparqlCode = sparqlCode.split(dimension.name).join(dimension.newHierarchyDimension+'_temp');
          visitedVE = visitedVE.concat(edges.map(item => item[0]))
          vistitedEdges[key] = edges
          dimensionHier.push(dimension.hierarchyDim);
        }
        else{
          sel.push('?'+dimension.name)
          grpby.push('?'+dimension.name)
        }
        dimensionsWithHierarchies[dimension['name']]={'name':dimension['name'],'hierarchy':dimension['hierarchy'],'hierarchyDim':dimension['newHierarchyDimension']}
      }

      const derivedCubeCode = this.splitCode(sparqlCode)


      let dividedCodeVE = {};
      let prefixes = derivedCubeCode.prefix;
      // PREFIX
      for(let VE in visitedVE){
        const codeVE = this.state.virtualEntities[visitedVE[VE]].entity.sparqlCode;
        dividedCodeVE[visitedVE[VE]] = this.codeDivision(codeVE);
        prefixes = prefixes.concat(dividedCodeVE[visitedVE[VE]].prefix);
      }
      
      prefixes = [...new Set(prefixes)];
      

      //// OUTER WHERE ////
      const innerCode = '{\n'+derivedCubeCode.select +'\n'+derivedCubeCode.where+'\n'+derivedCubeCode.groupBy+'\n}'
      

      for(let singleDimension in vistitedEdges){
        const dim = vistitedEdges[singleDimension];        
        if (dim[0][1]==='ru'){
          rollup.push([dimensionsWHier[singleDimension]['name'],dimensionsWHier[singleDimension]['hierarchy'],dimensionsWHier[singleDimension]['newHierarchyDimension']])
          dividedCodeVE[dim[0][0]]['where'] = dividedCodeVE[dim[0][0]]['where'].join('\n').split(this.state.virtualEntities[dim[0][0]].entity.signature[0].fieldName).join(dimensionsWHier[singleDimension]['newHierarchyDimension']+'_temp').split('\n');
        }
        else{
          drilldown.push([dimensionsWHier[singleDimension]['name'],dimensionsWHier[singleDimension]['hierarchy'],dimensionsWHier[singleDimension]['newHierarchyDimension']])
          dividedCodeVE[dim[0][0]]['where'] = dividedCodeVE[dim[0][0]]['where'].join('\n').split(this.state.virtualEntities[dim[0][0]].entity.signature[1].fieldName).join(dimensionsWHier[singleDimension]['newHierarchyDimension']+'_temp').split('\n');
        }
        if (dim[dim.length-1][1]==='ru'){
          dividedCodeVE[dim[dim.length-1][0]]['where'] = dividedCodeVE[dim[dim.length-1][0]]['where'].join('\n').split(this.state.virtualEntities[dim[dim.length-1][0]].entity.signature[1].fieldName).join(dimensionsWHier[singleDimension]['name']).split('\n');
        }
        else{

          dividedCodeVE[dim[dim.length-1][0]]['where'] = dividedCodeVE[dim[dim.length-1][0]]['where'].join('\n').split(this.state.virtualEntities[dim[dim.length-1][0]].entity.signature[0].fieldName).join(dimensionsWHier[singleDimension]['name']).split('\n');
        }

        sel.push('?'+dimensionsWHier[singleDimension]['name'])
        grpby.push('?'+dimensionsWHier[singleDimension]['name'])
      }

      if(dimensionsWOHier!==undefined){
        for(let dimens in dimensionsWOHier){
          if(dimensionsWOHier[dimens]===false){
            rollup.push([dimens])
          }
          else{
            dimensionsWithHierarchies[dimens]={'name':dimens};
            sel.push('?'+dimens);
            grpby.push('?'+dimens);
          }
        }
      }

      
      let where = []
      for(let i in dividedCodeVE){
        where = where.concat(dividedCodeVE[i]['where']).concat('.')
      }
      where.push(innerCode)
      where = where.join('\n')
      
      for(let singleMeas in data.measures){
        let meas = data.measures[singleMeas]
        if(meas.checked){
          sel.push('('+meas['newMeasureOperation']+'(?'+singleMeas+') as ?'+meas['newMeasureOperationName']+')')
          measuresCube.push([
            singleMeas,
            meas['newMeasureOperationName'],
            meas['newMeasureOperation']
          ])
        }
      }
      
      const finalCode = this.createCode(prefixes,sel,where,grpby)
      
      const derivedCube={
        name:data.name,
        baseDataCube:this.state.cube.name,
        rollup:rollup,
        drilldown:drilldown,
        measures:measuresCube,
        dimensions:dimensionsWithHierarchies,
        cubeCode:'',
        sparqlCode:finalCode
      }
      

      postDerivedCube(
        this.props.match.params.ontologyName,
        decodeURIComponent(this.props.match.params.ontologyVersion),
        derivedCube,
        () => this.props.addDerivedCube(data.name)
      );

      this.setState({ addCubeDerived: false, clickedMeasures:[]})

    }

    handleFormSubmit = (data) => {
      // Store the form data in the state
      if (this.state.clickedMeasures.length>0){
  
        this.handleAddDerivedCube(data);
      }
      else{
        message.error('You have to select at least a measure')
      }
    };

    convertData(results){
    
        var data = [], columns;
        for (let i = 0; i < results.results.length; i++) {
          let object = {};
          for (let j = 0; j < results.results[i].length; j++) {
            if (!results.headTypes[results.headTerms[j]]) {
              object[results.headTerms[j]] = results.results[i][j].value
            } else if (results.headTypes[results.headTerms[j]].includes('OBJECT')) {
              object[results.headTerms[j]] = <Tooltip placement='left' title={`Individual: ${results.results[i][j].value}`}>{results.results[i][j].shortIRI}</Tooltip>
            } else {
              object[results.headTerms[j]] = <Tooltip placement='left' title={results.headTypes[results.headTerms[j]].join(', ')}>{results.results[i][j].value}</Tooltip>
            }
          }
          object.key = i;
          data.push(object);
        }
        
        columns = results.headTerms.map(item => ({
          title: item,
          dataIndex: item,
        }))
        
        this.setState({tableData:data,tableAttributes:columns})
    }

    getExecutionID = () => {
        return this.state.execid
    }
      
    getResults = () => {
        getQueryResults(
          this.state.endpoints[0].name,
          this.getExecutionID(),
          this.state.pagination.current,
          this.state.pagination.pageSize,
          this.convertData.bind(this),
          (error) => {
            // this.setState({execid:executionID})
            console.log(error);
          },
        )
    }
    
    downloadResults = () => {
        downloadQueryResults(
          this.state.endpoints[0].name,
          this.getExecutionID(),
          saveFileInfo)
    }
    
    showTotal = () => {
        // Create the menu for the dropdown
      
        return (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <span style={{ paddingLeft: 8}}>
            <Button
              size='small'
              type='primary'
              icon={<DownloadOutlined />}
              onClick={this.downloadResults}
              style={{ marginLeft: 10 }}
            >
              Download Query Results
            </Button>
            </span>
            <span style={{ paddingLeft: 8, color: 'var(--white)' }}>
              {this.state.pagination.total} total results
            </span>
    
          </div>
        );
    }

    checkStatus(status) {
        if (status.status === 'FINISHED') {
          this.getResults()
          message.success('Executed Query')
          this.state.pagination.total=status.numResults
          this.setState({loading:false, showing_table:true,totalResults:status.numResults,visibleMSG:false,readyNum:0})
          this.state.pagination.showTotal = this.showTotal
          
        }
        else{
          if(status.status === 'ERROR'){
            message.warn('Not Correct query')
            this.setState({loading:false, showing_table:false})
          }
          else if(this.state.visibleMSG===false && status.status === 'RUNNING'){
            this.setState({visibleMSG:true})
            const loadingMessage = message.loading('Executing Query', 0);
            setTimeout(() => {
              loadingMessage()
              this.getStatusQuery();
            }, 500);
          }
          else{
            if (status.status==='READY'){
              if (this.state.readyNum <7){
                let rn = this.state.readyNum;
                rn += 1;
                this.setState({readyNum:rn});
              }
            }
            if (this.state.readyNum < 7){
              setTimeout(() => {
                this.getStatusQuery();
              }, 1000);
            }
            else{
                message.error(<span>Something goes wrong<br/>Define properly the values</span>)
                this.setState({loading:false, showing_table:false, readyNum:0})
            }
          }
        }
    }

    getStatusQuery() {
        getQueryStatus(
          this.state.endpoints[0].name,
          this.getExecutionID(),
          this.checkStatus.bind(this),
          this.errorPolling
        )
    }

    getQueryParameters = () => {
        return {
          queryID: this.state.cube.name,
          queryCode: this.state.query_Code,
          construct: false,
          mappingParameters: {},
          queryTags:[]
        }
    }

    recursiveCheck = (nameMeasure, operation, cube) => {
      
      if(Object.keys(this.state.baseCubeList).includes(cube)){
        return true
      }

      const cubeData = this.state.derivedCubeList[cube];

      for(let i in cubeData.measures){

        const singleCubeMeas = cubeData.measures[i];
        if(singleCubeMeas[1]===nameMeasure){
          if(singleCubeMeas[2]===operation){
            const res = this.recursiveCheck(singleCubeMeas[0],singleCubeMeas[2],cubeData.baseDataCube)
            return res;
          }
        }
      }
      return false

      
      
    }

    isExecutable = () => {
      const actualMeasures = this.state.cube.measures;
      let checkMeas = true;
      for(let i in actualMeasures){
        const meas = actualMeasures[i];
        if(!['max','min','sum'].includes(meas[2])){
          return 'No'
        }
        const res = this.recursiveCheck(meas[0],meas[2],this.state.cube.baseDataCube);
        checkMeas = checkMeas && res;
      }
      if(!checkMeas){
        return 'No'
      }
      else{
        const code = '';
        let currentCube = this.state.cube.baseDataCube;
        while(true){
          if(!Object.keys(this.state.derivedCubeList).includes(currentCube)){
            break;
          }
          currentCube = this.state.derivedCubeList[currentCube].baseDataCube;
        }

        let startingCode = this.state.baseCubeList[currentCube].sparqlCode;
        startingCode = this.splitCode(startingCode)
        
        const inputString = startingCode['where']
        const regex = /\{([\s\S]*?)\}/;
        startingCode['where'] = inputString.match(regex)[1].trim();
        

        // Modify the where, add needed sparql query body to reach desired hierarchy dimensions
        let VE = []

        for(let i in this.state.cube.dimensions){
          const derivedCubeDim = this.state.cube.dimensions[i]
          const baseCubeDim = this.state.baseCubeList[currentCube].dimensions[i]
          if(derivedCubeDim.hierarchy!==undefined){
            const edges = this.searchPathInstance.searchPath(
              this.state.hierarchies[derivedCubeDim.hierarchy]['signature'],
              baseCubeDim.hierarchyDim,
              derivedCubeDim.hierarchyDim
            );
            VE = VE.concat(edges.map(item => item[0]));
            

            

            let source,dest;

            if(edges.length>0){
              if (edges[0][1]==='ru'){
                source = this.state.virtualEntities[edges[0][0]].entity.signature[0].fieldName;
              }
              else{
                source = this.state.virtualEntities[edges[0][0]].entity.signature[1].fieldName;
              }
              if (edges[edges.length-1][1]==='ru'){
                dest = this.state.virtualEntities[edges[edges.length-1][0]].entity.signature[1].fieldName;
              }
              else{
                dest = this.state.virtualEntities[edges[edges.length-1][0]].entity.signature[0].fieldName;
              }
            }

            
            startingCode['select'] = startingCode['select'].split(source).join(dest);
            startingCode['groupBy'] = startingCode['groupBy'].split(source).join(dest);
            

          }
        }

        for(let i in VE){
          const VirtEnt = this.state.virtualEntities[VE[i]];
          const bodyQuery = this.splitCode(VirtEnt.entity.sparqlCode);
          const where = bodyQuery['where'].match(regex)[1].trim();
          startingCode['where'] =  startingCode['where'] + '\n.\n'+where;
          startingCode['prefix'].concat(bodyQuery['prefix'])
        }
        
        const innerCode = startingCode.select + '\nWHERE { \n' + startingCode.where + '\n}\n' +  startingCode.groupBy;

        // External Query
        let externalSelect = [];
        let externalGroupBy = [];
        const externalWhere = 'WHERE {\n'+innerCode+'\n}'
        const externalPrefix = [...new Set(startingCode['prefix'])].join('\n');
        
        for(let i in this.state.cube.dimensions){
          externalSelect.push('?'+i)
          externalGroupBy.push('?'+i)
        }

        for(let i in this.state.cube.measures){
          const cubeMeas=this.state.cube.measures[i];
          
          let currentMeasure = cubeMeas[0];
          const currentCb = this.state.cube.baseDataCube;
          
          while(true){
            if(!Object.keys(this.state.derivedCubeList).includes(currentCb)){
              break;
            }
            const previousMeasure = this.state.derivedCubeList[currentCb].measures.filter(item => item[1]===currentMeasure)[0]
            currentMeasure = previousMeasure[0]
            currentCb = this.state.derivedCubeList[currentCb].baseDataCube;
          }

          externalSelect.push('('+cubeMeas[2]+'(?'+currentMeasure+') as ?'+cubeMeas[1]+')');
        }

        externalSelect = 'SELECT DISTINCT ' + externalSelect.join(' ');
        externalGroupBy = 'GROUP BY '+ externalGroupBy.join(' ');

        const externalQuery = externalPrefix + '\n' + externalSelect +' \n' +externalWhere + '\n' +externalGroupBy

        return externalQuery;
      }

      
      
    }
    
    runQuery(queryCode, endpoint) {
        if(endpoint!==undefined){
          if(queryCode.split('WHERE').length>3){
            const resultIsExec = this.isExecutable();
            if(resultIsExec!=='No'){
              message.loading(
                <div>
                  I'm trying to solve the query.
                </div>
              )
              this.setState({query_Code:resultIsExec},() =>{
                startNewQuery(
                  endpoint.name,
                  this.getQueryParameters(),
                  undefined, undefined, undefined, undefined, undefined, undefined, undefined,
                  (executionID) => {
                          this.setState({execid:executionID, loading:true},() =>{
                            this.getStatusQuery(executionID)
                          })
                  }
                )
              }) 
            }
            else{
              message.error(
                <div>
                  The system is not able to handle this query<br/> This will be introduced in future releases.
                </div>
              )
            }
          }
          else{
            let cube_code = queryCode;
            this.setState({query_Code:cube_code},() =>{
              startNewQuery(
                endpoint.name,
                this.getQueryParameters(),
                undefined, undefined, undefined, undefined, undefined, undefined, undefined,
                (executionID) => {
                        this.setState({execid:executionID, loading:true},() =>{
                          this.getStatusQuery(executionID)
                        })
                }
              )
            }) 
          }      
        }
        else {
          message.warn(
            <div>
              No endpoints are running <br/> <a href='/#/mastro'><div className="message-warn">Please run an endpoint or create one</div></a>
            </div>
          )
        }
    }

    handleTableChange = (pag) => {
      this.state.pagination.current=pag.current
      this.state.pagination.pageSize=pag.pageSize
      this.getResults()
    };

    removePrevious = (graph, startNode) => {
      const visited = new Set();
      const stack = [startNode];
    
      while (stack.length > 0) {
        const node = stack.pop();
        visited.add(node);
    
        for (const edge of graph) {
          if (edge['input1'] === node && !visited.has(edge['input2'])) {
            stack.push(edge['input2']);
          }
        }
      }
    
      return Array.from(visited);
    }

    // Check if a dimension without hierarchy was "rolled up"
    checkDimensionkey = (dimensionkey) => {
      for(let key in this.state.cube.rollup){
        const dimens = this.state.cube.rollup[key]
        if (dimens[0] === dimensionkey){
          return false
        }
      }
      return true
    }

    findNodesInPath(graph, startNode, arrivalNode) {
      const visited = new Set();
      const path = [];
      const result = [];
    
      function dfs(node) {
        visited.add(node);
        path.push(node);
    
        if (node === arrivalNode) {
          result.push(...path);
        } else {
          const neighbors = graph.filter(edge => edge.input1 === node || edge.input2 === node);
          for (const neighbor of neighbors) {
            const nextNode = neighbor.input1 === node ? neighbor.input2 : neighbor.input1;
            if (!visited.has(nextNode)) {
              dfs(nextNode);
            }
          }
        }
    
        path.pop();
        visited.delete(node);
      }
    
      dfs(startNode);
      return result;
    }

    getHierarchiesAvailableNodesDimens = (hierarchy, actualNode) => {

      const startingNode1 = this.getStarting(actualNode)

      const actualDime = this.actualHierarchyDimensionValue(actualNode)

      const nodes = this.removePrevious(hierarchy.signature,actualDime)
      let reachOrigin = this.findNodesInPath(hierarchy.signature, actualDime, startingNode1).concat(nodes);
      reachOrigin = [...new Set(reachOrigin)];
      return reachOrigin;
    }

    popoverContentHierarchy = (data) => {
      if(this.state.hierarchies[data]!==undefined){
        let edges=[];
            const hier = this.state.hierarchies[data].signature
            
            for (let i = 0; i<hier.length;i++){
                edges.push([hier[i]["input1"],hier[i]["input2"]])
            }
            
            
            return(<div style={{ width: '500', height: '400' }}>
                 <HierarchyVisualization nodesHier={edges} />
            </div>)
      }
      else{
        return(<div>
          The Hierarchy does not exist
          </div>
        )
      }
    }

    handleMeasureCheck = (measure) => {
      let cm = this.state.clickedMeasures;
      if(cm.includes(measure)){
        cm = cm.filter(item => item !== measure);
      }
      else{
        cm.push(measure)
      }
      this.setState({clickedMeasures:cm},()=>{
        console.log(this.state.clickedMeasures)  
      })
      
    }

    getStarting = (attributeName) => {
      let currentCube = this.state.cube.baseDataCube;
      if (this.state.baseCubeList[currentCube]!==undefined){
        while(true){
          if(!Object.keys(this.state.derivedCubeList).includes(currentCube)){
            return this.state.baseCubeList[currentCube]['dimensions'][attributeName]['hierarchyDim']
          }
          currentCube = this.state.derivedCubeList[currentCube].baseDataCube;
        }

      }
      else{
        return 'wait'
      }


    }

    actualHierarchyDimensionValue = (dimensionKey) => {
      if (this.state.cube.dimensions[dimensionKey]!==undefined){
        for(let key in this.state.cube.rollup){
          const dimens = this.state.cube.rollup[key]
          if (dimens[0] === dimensionKey){
            return dimens[1]
          }
        }

        return this.state.cube.dimensions[dimensionKey]['hierarchyDim']
      }
      else{
        return 'wait'
      }

    }

    render() {
        const data = this.state.cube
        
        if (data === null || this.state.baseDataCube===undefined || this.state.loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 36 }}> <Spin size='large' /></div>

        const first = [
        {
            mapKey: "Base Data Cube",
            mapValue: data.baseDataCube
        },
        {
            mapKey: "Code",
            mapValue: data.cubeCode
        },
        ]

        for (let key in data.rollup){
            const ru = data.rollup[key]
            if (ru.length>1){
                const sign = {
                        mapKey: "Roll-up",
                        mapValue: 'on '+ru[0] + ' at node ' + ru[1] + ' of '+ ru[2],
                }

                first.push(sign)
            }
            else{
                const sign = {
                    mapKey: "Roll-up",
                    mapValue: 'on '+ru[0],
                }

                first.push(sign)
            }
        }

        for (let key in data.drilldown){
            const dd = data.drilldown[key]
            if (dd.length>1){
                const sign = {
                        mapKey: "Drill-down",
                        mapValue: 'on '+dd[0] + ' at node ' + dd[1] + ' of '+ dd[2],
                }

                first.push(sign)
            }
            else{
                const sign = {
                    mapKey: "Drill-down",
                    mapValue: 'on '+dd[0],
                }

                first.push(sign)
            }
        }


        for (let key in data.measures){
          const dm = data.measures[key]
          if(dm[1] !==null || dm[1] !==undefined){
            const sign = {
              mapKey: "Measure",
              mapValue: dm[1]+' with operation '+dm[2]+'('+dm[0]+')',
            }
            first.push(sign)
          }
        }

        const elements = [
        <Card
            size='small'
            className='mappingSQLCard'
            actions={[
                <Tooltip title={'Add New Derived Cube'}>
                    <div style={{ cursor: 'pointer' }} onClick={() => {
                    this.setState({addCubeDerived:true})
                    }}>
                        <PlusOutlined />                
                    </div>
                </Tooltip>,
                <Tooltip title={'Run'}>
                    <div style={{ cursor: 'pointer' }} onClick={() => {
                    this.runQuery(this.state.cube.sparqlCode, this.state.endpoints[0]);
                    }}>
                        <ThunderboltOutlined />                
                    </div>
                </Tooltip>,
                <Popconfirm title='Do you want to delete Derived Cube?' onConfirm={this.handleDeleteDerivedCube}>
                    <div className='delete-icon' style={{ paddingLeft: 12 }}>
                        <DeleteOutlined />
                    </div>
                </Popconfirm>
                ]}>
                <ListDerivedCubeItem data={first} />
        </Card>,
        ]

        


        return (
        <div style={{ paddingTop: 12 }}>
            <div style={{ textAlign: 'center' }}>
            <h1>{data.name}</h1>
            </div>
            <div style={{ height: 'calc(100vh - 172px)', overflowY: 'auto', padding: '0px 8px' }}>
            <List
                grid={{ column: 1 }}
                dataSource={elements}
                renderItem={item => (
                <List.Item>
                    {item}
                </List.Item>
                )}
            />
            {this.state.showing_table?
            <div style={{ width: '100%', overflow: 'auto', marginTop: 10 }} className='results'>
                <Table
                dataSource={this.state.tableData}
                columns={this.state.tableAttributes}
                rowKey={record => record.key}
                pagination={this.state.pagination}
                size='small'
                scroll={{ x: '100%' }}
                onChange={this.handleTableChange}
                />
            </div>:null
            }
            
            </div>

            <Drawer  
                title={'Define operation over hierarchies for cube '+this.state.cube.name}
                visible={this.state.addCubeDerived}
                onClose={() => this.setState({ addCubeDerived: false,  clickedMeasures:[]})}
                destroyOnClose
                width={'50vw'}>
                  <Form layout='vertical' ref={this.formRefHier} onFinish={this.handleFormSubmit} onClose={() => this.setState({ visibleHierarchyOperation: false,  clickedMeasures:[], hierarchyAvailableOper:{'r_u':true,'d_d':true}})}>
                    <Form.Item label="Name" name="name" rules={[{required:true}]}>
                      <Input placeholder='Set Name of New Derived Cube' autoComplete='off'/>
                    </Form.Item>
                      {Object.keys(this.state.baseDataCube.dimensions)
                        .filter(dimensionKey => this.state.baseDataCube.dimensions[dimensionKey]['hierarchy'] === undefined && this.checkDimensionkey(dimensionKey))
                        .map(dimensionKey => (
                          <div key={dimensionKey}>
                            <div>
                              <Form.Item name={['dimension', dimensionKey]} label='Dimension without hierarchy' initialValue={true} valuePropName="checked">
                                  <Checkbox  >{dimensionKey}</Checkbox>
                              </Form.Item>
                            </div>
                          </div>
                        ))}
                      <Divider orientation="left" plain>
                          Dimensions with Hierarchies
                      </Divider>
                      {Object.keys(this.state.baseDataCube.dimensions)
                        .filter(dimensionKey => this.state.baseDataCube.dimensions[dimensionKey]['hierarchy'] !== undefined)
                        .map(dimensionKey => (
                          <div key={dimensionKey}>
                            <div style={{ width: '20%', display: 'inline-block', marginRight: '5%' }}>
                              <Form.Item label="Dimension Name" name={['dimensions', dimensionKey, 'name']} initialValue={dimensionKey}>
                                <Input readOnly={true} placeholder='Cube Dimension Name' />
                              </Form.Item>
                            </div>
                            <div style={{ width: '20%', display: 'inline-block', marginRight: '5%' }}>
                            <Form.Item 
                              label={<span>
                                        Hierarchy{' '}
                                        <Popover content={this.popoverContentHierarchy(this.state.baseDataCube.dimensions[dimensionKey]['hierarchy'])} title={null} trigger="click" placement="left">
                                            <BsInfoCircle className="custom-icon" />
                                        </Popover>
                                    </span>} 
                              name={['dimensions', dimensionKey, 'hierarchy']} 
                              initialValue={this.state.baseDataCube.dimensions[dimensionKey]['hierarchy']}
                            >
                                <Input readOnly={true}/>
                              </Form.Item>
                            </div>

                            <div style={{ width: '20%', display: 'inline-block', marginRight: '5%' }}>
                              <Form.Item label="Starting Dimension" name={['dimensions', dimensionKey, 'hierarchyDim']} initialValue={this.actualHierarchyDimensionValue(dimensionKey)}>
                                <Input readOnly={true} />
                              </Form.Item>
                            </div>
                            <div style={{ width: '20%', display: 'inline-block', marginRight: '5%' }}>
                              <Form.Item label="Move on" name={['dimensions', dimensionKey, 'newHierarchyDimension']} initialValue={this.actualHierarchyDimensionValue(dimensionKey)}>
                                <Select>
                                  {this.state.hierarchies[this.state.baseDataCube.dimensions[dimensionKey]['hierarchy']]!==undefined?
                                  this.getHierarchiesAvailableNodesDimens(this.state.hierarchies[this.state.baseDataCube.dimensions[dimensionKey]['hierarchy']],dimensionKey)
                                    .map(node => (
                                      <Select.Option key={node} value={node} >
                                                      {node}
                                      </Select.Option>
                                    )):null}
                                </Select>
                              </Form.Item>
                            </div>
                          </div>
                        ))}

                      <Divider orientation="left" plain>
                        Measures
                      </Divider>

                      {Object.keys(this.state.cubeMeasures)
                        .filter(item => item[1]!==null)
                        .map(measureKey => (
                          <div key={measureKey}>
                            <div style={{ width: '18%', display: 'inline-block', marginRight: '5%' }}>
                              <Form.Item name={['measures', this.state.cube.measures[measureKey][1], 'checked']} label='Measure' valuePropName="checked">
                                  <Checkbox  onClick={() => this.handleMeasureCheck(measureKey)}>{this.state.cube.measures[measureKey][1]}</Checkbox>
                              </Form.Item>
                            </div>
                              <div style={{ width: '18%', display: 'inline-block', marginRight: '5%' }}>
                              <Form.Item
                                label="Operation"
                                name={['measures', this.state.cube.measures[measureKey][1], 'oldOperation']} 
                                initialValue={this.state.cube.measures[measureKey][2]+'('+this.state.cube.measures[measureKey][0]+')'}
                              >
                                  <Input readOnly={true}/>
                                </Form.Item>
                              </div>

                              <div style={{ width: '23%', display: 'inline-block', marginRight: '5%' }}>
                                <Form.Item label="New Operation" name={['measures', this.state.cube.measures[measureKey][1], 'newMeasureOperation']} 
                                  rules={[{required: this.state.clickedMeasures.includes(measureKey),message: 'Please select an operation.',},
                                  ]}
                                >
                                  <Select disabled={!this.state.clickedMeasures.includes(measureKey)}>
                                    <Select.Option key={'count'} value={'count'}>COUNT</Select.Option>
                                    <Select.Option key={'max'} value={'max'}>MAX</Select.Option>
                                    <Select.Option key={'min'} value={'min'}>MIN</Select.Option>
                                    <Select.Option key={'sum'} value={'sum'}>SUM</Select.Option>
                                    <Select.Option key={'avg'} value={'avg'}>AVG</Select.Option>
                                  </Select>
                                </Form.Item>
                              </div>
                              <div style={{ width: '20%', display: 'inline-block' }}>
                                <Form.Item label="Name" name={['measures', this.state.cube.measures[measureKey][1], 'newMeasureOperationName']}
                                  rules={[{required: this.state.clickedMeasures.includes(measureKey),message: 'Please define a name.',},
                                ]}
                                >
                                  <Input placeholder='Name for measure' disabled={!this.state.clickedMeasures.includes(measureKey)}/>
                                </Form.Item>
                              </div>
                          </div>
                        ))}



                    <Form.Item style={{ textAlign: 'center' }}>
                      <Button 
                        onClick={() => this.setState({
                          addCubeDerived: false, 
                          clickedMeasures:[]
                        })} 
                        style={{ marginRight: 8 }}>
                        <FaWindowClose />
                      </Button>
                      <Button htmlType='submit' type="primary">
                        <ThunderboltOutlined />
                      </Button>
                    </Form.Item>
                  </Form>

            </Drawer>
        </div>
        )
    }
}