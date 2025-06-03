import React from 'react';
import { ThunderboltOutlined, DownloadOutlined, DownOutlined, FilterOutlined} from '@ant-design/icons';
import { BsInfoCircle } from "react-icons/bs";
import { MdOutlineFilterAlt } from "react-icons/md";
import { VscRunBelow } from "react-icons/vsc";
import { Card, List, Divider, Modal, Tooltip, Dropdown, Menu, Input, Button, Drawer, Form, Radio, Checkbox, Spin, Select, Popover, Table, message } from 'antd'
import { postDerivedCube, getCube, getHierarchies, deleteCube, postAuhtorizationViewProfiles, putAuhtorizationViewProfile, getVirtualEntities } from '../../../api/OntologyApi';
import { getMastroEndpointsRunning, startNewQuery, getQueryResults, getQueryStatus, downloadQueryResults } from '../../../api/EndpointApi';
import ListCubeItem from '../../components/ListCubeItems';
import { saveFileInfo } from '../../../utils/utils';
import { FaWindowClose } from "react-icons/fa";
import { TbHierarchy } from "react-icons/tb";
import { FcClearFilters, FcDeleteDatabase } from "react-icons/fc";
import HierarchyVisualization from './HierarchyVisualization';
import SearchPath from './SearchPath'



export default class CubeHandlePage extends React.Component {
  formRefOper = React.createRef();
  formRefHier = React.createRef();
  searchPathInstance = new SearchPath();

  interval = 0;

  state = {
    tables: [],
    loading: true,
    cube: null,
    endpoints:[],
    chosenEndpoint:undefined,
    isSelectedEndpoint:false,
    showing_table:false,
    collected_data:null,
    VE_Code:null,
    execid:null,
    pagination: {
      current: 1,
      pageSize: 10,
      total:0,
      showSizeChanger: true,
    },
    visibleROLAP:false,
    visibleMSG:false,
    actualCode:'',
    separatedCode:{},
    actualFilters:{
      'dimensions':[],
      'measures':[]
    },
    hierarchies:{},
    virtualEntities:{},
    cubeDimensions:{},
    //
    dimensionsOperation:{},
    measuresOperation:{},
    popoverVisible: false,
    inputValue:'',

    visibleHierarchyOperation:false,
    isModalVisible: false,
    formData:{},
    userChoice:null,
    clickedMeasures:[],
    readyNum:0,
  };

  popoverContent = () => {
    // Combine the two lists (x and y) into a single list
    const combinedList = this.state.actualFilters['dimensions']
    const listFilter = combinedList.concat(this.state.actualFilters['measures']);
  
    return (
      <div>
        <div style={{ backgroundColor: '#14202B', whiteSpace: 'pre-line' }}>
          {listFilter.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </div>
      </div>
    );
  };

  setFields() {
    let cube = this.state.cube;
    console.log(cube)
  }

  componentDidMount() {
    this.getDataCube()
    getMastroEndpointsRunning((ep) => {
      this.setState({endpoints:ep})
    })
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
          this.setState({virtualEntities:data})
      }
    )
  }
  
  returnState() {
    return this.state
  }

  componentDidUpdate(prevProps) {
    if (prevProps.chosen_cube !== this.props.chosen_cube) {
      this.getDataCube()
    }
  }
  
  // GET DATA OF CHOSEN CUBE
  getDataCube = () => {
    this.setState({ data: null, loading: true, visibleMSG:false })
    getCube(
      this.props.match.params.ontologyName,
      decodeURIComponent(this.props.match.params.ontologyVersion),
      this.props.chosen_cube,
      this.loaded
    );
  }

  loaded2 = (data) => {
    for (let i in data){
      if (i == this.state.cube.virtualEntity){
        this.setState({VE_Code:data[i].entity.sparqlCode})
        this.setFields()
      }
    }
  }

  loaded = (data) => {
    this.setState({ cube: data, cubeDimensions:data.dimensions, cubeMeasures:data.measures, loading: false, showing_table:false},() =>{
      getVirtualEntities (
        this.props.match.params.ontologyName,
        decodeURIComponent(this.props.match.params.ontologyVersion),
        this.loaded2
      )
    })
  }

  // ROLAP OPERATIONS
  handleSubmitFilters = values => {
    let actualFilters = {};
    let afD = [];
    let afM = [];

    const sepCode = this.state.separatedCode
    let code = this.state.actualCode;
    // let filter = "FILTER (\n";
    let filter = [];
    let having = [];
    console.log(values)
    for(let key in values.dimensions){
      const dimension = values.dimensions[key];
      if (![undefined,"None"].includes(dimension['operation'])){
        if (["><","<>"].includes(dimension['operation'])){
          console.log(!isNaN(dimension['value1'])&&!isNaN(dimension['value2'])&&parseInt(dimension['value1'])>parseInt(dimension['value2']))
          if (!isNaN(dimension['value1'])&&!isNaN(dimension['value2'])&&parseInt(dimension['value1'])>parseInt(dimension['value2'])||isNaN(dimension['value1'])&&isNaN(dimension['value2'])&&dimension['value1']>dimension['value2']){
            message.warn("Wrong comparison values for "+key+" dimension")
          }
          else{
            if (dimension['operation'] == "<>"){
              const VEAttr = this.state.cube.dimensions[key]['veAttribute'];
              let row = "?"+VEAttr+' > "'+dimension['value1']+'"'
              afD.push( key+' > '+dimension['value1'])
              filter.push(row)
              row = "?"+VEAttr+' < "'+dimension['value2']+'"'
              afD.push( key+' < '+dimension['value2'])
              filter.push(row)
            }
            else{
              const VEAttr = this.state.cube.dimensions[key]['veAttribute'];
              let row = "?"+VEAttr+' < "'+dimension['value1']+'"'
              afD.push( key+' < '+dimension['value1'])
              filter.push(row)
              row = "?"+VEAttr+' > "'+dimension['value2']+'"'
              afD.push( key+' > '+dimension['value2'])
              filter.push(row)
            }
          }
        }
        else {
          const VEAttr = this.state.cube.dimensions[key]['veAttribute'];
          const row = "?"+VEAttr+" "+dimension['operation']+' "'+dimension['value1']+'"'
          afD.push( key+" "+dimension['operation']+' '+dimension['value1'])
          filter.push(row)
        }
      }
    }
    actualFilters['dimensions']=afD

    
    for(let key in values.measures){
      const measure = values.measures[key];
      if (![undefined,"None"].includes(measure['operation'])){
        if (["><","<>"].includes(measure['operation'])){
          console.log(!isNaN(measure['value1'])&&!isNaN(measure['value2'])&&parseInt(measure['value1'])>parseInt(measure['value2']))
          if ((!isNaN(measure['value1'])&&!isNaN(measure['value2'])&&parseInt(measure['value1'])>parseInt(measure['value2']))||(isNaN(measure['value1'])&&isNaN(measure['value2'])&&measure['value1']>measure['value2'])){
            message.warn("Wrong comparison values for "+key+" measure")
          }
          else{
            if (measure['operation'] == "<>"){
              const VEAttr = this.state.cube.measures[key]['measureOperation']+"(?"+this.state.cube.measures[key]['veAttribute']+")";
              let row = VEAttr+" > "+measure['value1']
              afM.push( key+' > '+measure['value1'])
              having.push(row)
              row = VEAttr+" < "+measure['value2']
              afM.push( key+' < '+measure['value2'])
              having.push(row)
            }
            else{
              const VEAttr = this.state.cube.measures[key]['measureOperation']+"(?"+this.state.cube.measures[key]['veAttribute']+")";
              let row = VEAttr+" < "+measure['value1']
              afM.push( key+' < '+measure['value1'])
              having.push(row)
              row = VEAttr+" > "+measure['value2']
              afM.push( key+' > '+measure['value2'])
              having.push(row)
            }
          }
        }
        else {
          const VEAttr = this.state.cube.measures[key]['measureOperation']+"(?"+this.state.cube.measures[key]['veAttribute']+")";
          const row = VEAttr+" "+measure['operation']+' '+measure['value1']
          afM.push( key+" "+measure['operation']+' '+measure['value1'])
          having.push(row)
        }
      }
    }
    actualFilters['measures']=afM
    
    let finalCode = sepCode['prefix'].join('\n') + '\n' + sepCode['select'] + '\n'


    code = code.split('\n');
    if (filter.length>0  || having.length>0){
      finalCode = finalCode + 'WHERE {'+ sepCode['where'].join('\n')+ '.\n'
      if(filter.length>0){
        filter = "FILTER(\n" + filter.join(" &&\n") + '\n)'
        sepCode['filter'] = filter;
        finalCode = finalCode + filter 
      }
      finalCode = finalCode + '\n}\n'

      finalCode = finalCode + sepCode['groupBy'] +'\n'

      if(having.length>0) {
        having = "HAVING(\n" + having.join(" &&\n") + '\n)'
        sepCode['having'] = having;
        finalCode = finalCode + having
      }
      this.runQuery(this.codeByObject(sepCode),this.state.endpoints)
      this.setState({ visibleROLAP: false,separatedCode:sepCode,actualFilters:actualFilters,dimensionsOperation:{},measuresOperation:{}})
    }
    else{
      message.warn("No Filter defined")
      this.setState({ visibleROLAP: false})
    }

  }

  toggleFilters = (data) => {
    this.setState({
      visibleROLAP:true,
      })
  }

  changeOperationDimension = (operation, dimension) => {
    this.formRefOper.current.setFieldsValue({
      ['dimensions']: {
        [dimension]: {
          ['value1']:undefined,
          ['value2']:undefined,
        }
      },
    })

    this.setState((prevState) => {
      const updatedDimensionsOperation = { ...prevState.dimensionsOperation };
      updatedDimensionsOperation[dimension] = operation;
      return { dimensionsOperation: updatedDimensionsOperation };
    });
  };

  changeOperationMeasure = (operation, measure) => {
    this.formRefOper.current.setFieldsValue({
      ['measures']: {
        [measure]: {
          ['value1']:undefined,
          ['value2']:undefined,
        }
      },
    })

    this.setState((prevState) => {
      const updatedDimensionsMeasures = { ...prevState.measuresOperation };
      updatedDimensionsMeasures[measure] = operation;
      return { measuresOperation: updatedDimensionsMeasures };
    });
  };

  // QUERY EXECUTION
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
    const menu = (
      <Menu onClick={this.handleMenuClick}>
        <Menu.Item key="rolap" icon={<FilterOutlined />} onClick={this.toggleFilters}>Basic Filters</Menu.Item>
        <Menu.Item key="hierarchy" icon={<TbHierarchy />} onClick={this.toggleHierarchy}>Roll-up / Drill-down</Menu.Item>
      </Menu>
    );
  
    return (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <Popover
            content={this.popoverContent}
            placement="top"
            title={<span className="custom-popover-filters-title">Active Filters</span>}
            >
              {Object.keys(this.state.actualFilters).length>0?<MdOutlineFilterAlt className="custom-icon"/>:null}
        </Popover>
        <span style={{ paddingLeft: 8}}>
        <Dropdown overlay={menu} trigger={['hover']}>
          <Button size='small'>
            Select Operation <DownOutlined />
          </Button>
        </Dropdown>
        
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
    console.log(status.status,status.percentage, this.state.readyNum)
    if (status.status === 'FINISHED') {
      this.getResults()
      message.success('Executed Query')
      this.state.pagination.total=status.numResults
      this.setState({loading:false, showing_table:true,totalResults:status.numResults,visibleMSG:false,readyNum:0})
      this.state.pagination.showTotal = this.showTotal
      
    }
    else{
      if(status.status === 'ERROR'){
        message.warn('Define properly the values')
        this.setState({loading:false, showing_table:false})
      }
      else if(this.state.visibleMSG==false && status.status === 'RUNNING'){
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
            console.log('goingon')
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
            console.log('end')
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

  getQueryParameters = () => {
    return {
      queryID: this.state.cube.virtualEntity,
      queryDescription: this.state.cube.description,
      queryCode: this.state.query_Code,
      construct: false,
      mappingParameters: {},
      queryTags:[]
    }
  }

  separateCode = (sparqlCode) => {
    let code = sparqlCode.split('\n');
    let prefix = [];
    let select = [];
    let groupBy = [];
    for(let line in code){
      const row = code[line]
      if (row.startsWith("PREFIX")){
        prefix.push(row);
      }
      if (row.startsWith("SELECT")){
        select.push(row);
      }
      if (row.startsWith("GROUP BY")){
        groupBy.push(row);
      }
    }

    const fields = [];
    let inWhere = false;

    // Iterate through the list
    for (const item of code) {
      if (item.includes("WHERE")) {
        inWhere = true;
      } else if (inWhere && item.includes("}")) {
        break; // Stop collecting fields when we reach the closing curly brace
      } else if (inWhere) {
        fields.push(item.trim().replace(/{/g, '')); // Add items to the 'fields' array
      }
    }


    let codeSeparate = {
      'prefix':prefix,
      'select':select,
      'groupBy':groupBy,
      'where':fields
    }
    this.setState({separatedCode:codeSeparate})
  }

  getCubeRunCode() {
    if (this.state.cube.sparqlCode!=undefined){
      this.separateCode(this.state.cube.sparqlCode)
      this.setState({
        actualCode:this.state.cube.sparqlCode,
        actualFilters:{
          'dimensions':[],
          'measures':[]
        }
      })
      return (this.state.cube.sparqlCode);
    }
    else{
      let dimensions_VE = []
      let measures_VE = []
      let grouping_attr = []

      for(let key in this.state.cube.dimensions){
        dimensions_VE.push('(?'+this.state.cube.dimensions[key]['veAttribute']+' as ?'+this.state.cube.dimensions[key]['cubeDimensionName']+')');
        grouping_attr.push('?'+this.state.cube.dimensions[key]['veAttribute'])
      }
      dimensions_VE = dimensions_VE.join(' ');
      grouping_attr = 'GROUP BY '.concat(grouping_attr.join(' '));

      for(let key in this.state.cube.measures){
        measures_VE.push('('+this.state.cube.measures[key]['measureOperation']+'(?'+this.state.cube.measures[key]['veAttribute']+') as ?'+this.state.cube.measures[key]['cubeMeasureName']+')')
      }
      measures_VE = measures_VE.join(' ');


      const select_elements = dimensions_VE + ' ' + measures_VE;


      let rows=[];
      const code_rows=this.state.VE_Code.split('\n');
      console.log(select_elements)
      for (const row in code_rows){
        if(code_rows[row].startsWith('SELECT')){
          let row_par = ''
          const params = code_rows[row].split(' ').filter(item => item !== '')
          if (params[1]=='DISTINCT'){
            row_par = row_par + 'SELECT DISTINCT ' + select_elements;
          }
          else {
            row_par = row_par + 'SELECT ' + select_elements;
          }
          rows.push(row_par)

        }
        else {
          rows.push(code_rows[row])
        } 
      }
      rows.push(grouping_attr)
      rows = rows.join('\n')
      console.log(rows)

      return rows
    }
  }

  runQuery(queryCode, endpoints) {
    if(endpoints[0]!=undefined){
        if (this.state.chosenEndpoint==undefined){
          // message.info(<span><select></select></span>)
          console.log('not chosen')
          // this.setState({chosenEndpoint:endpoints[0]},() =>{
          //   this.runQuery(queryCode,endpoints)
          // })
          this.setState({isSelectedEndpoint:true})
        } 
        else{
          console.log('chosen endpoint');
          const endpoint = this.state.chosenEndpoint
          let cube_code = queryCode;

          this.setState({query_Code:cube_code},() =>{
            startNewQuery(
              endpoint,
              this.getQueryParameters(),
              undefined, undefined, undefined, undefined, undefined, undefined, undefined,
              (executionID) => {
                      this.setState({execid:executionID, loading:true, clickedMeasures:[]},() =>{
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


  // HIERARCHY OPERATIONS
  toggleHierarchy = () =>{
    this.setState({
      visibleHierarchyOperation:true,
      })
  }

  popoverContentHierarchy = (data) => {
    if(this.state.hierarchies[data]!=undefined){
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

  codeByObject = (sepCode) => {
    let code = '';
    if (sepCode['prefix']!==undefined){
      code = sepCode['prefix'].join('\n') +"\n";
    }
    code = code + sepCode['select'] +"\n";
    if(sepCode['filter']===undefined){
      code = code + "WHERE {\n" + sepCode['where'].join('\n') + "\n}\n";
    }
    else{
      code = code + "WHERE {\n" + sepCode['where'].join('\n') +'\n'+ sepCode['filter'] + "\n}\n";
    }
    code = code + sepCode['groupBy'];

    if(sepCode['having']!=undefined){
      code = code + "\n"+ sepCode['having'];
    }

    return code
  }

  handleHierarchiesOperations = (toSave,derivedCubeName) => {
    console.log(this.state.formData,'\n',this.state.separatedCode, toSave, derivedCubeName)

    // Take the VE that must be used in the rollup/drilldown operation
    let visitedVE = [];
    let vistitedEdges = {};
    let dimensionHier = [];
    const dimensionsWHier = this.state.formData.dimensions;
    for(let key in dimensionsWHier){
      const dimension = dimensionsWHier[key];
      if(dimension.hierarchyDim!==dimension.newHierarchyDimension){
        const edges = this.searchPathInstance.searchPath(
          this.state.hierarchies[dimension.hierarchy]['signature'],
          dimension.hierarchyDim,
          dimension.newHierarchyDimension
        );
        visitedVE = visitedVE.concat(edges.map(item => item[0]))
        vistitedEdges[key] = edges
        dimensionHier.push(dimension.hierarchyDim);
      }
    }
    
    let prefixes = this.state.separatedCode.prefix;
    let dividedCodeVE = {};
    
    let select = this.state.separatedCode.select[0]
    let where = this.state.separatedCode.where
    let groupBy = this.state.separatedCode.groupBy[0]

    // PREFIX
    for(let VE in visitedVE){
      const codeVE = this.state.virtualEntities[visitedVE[VE]].entity.sparqlCode;
      dividedCodeVE[visitedVE[VE]] = this.codeDivision(codeVE);
      prefixes = prefixes.concat(dividedCodeVE[visitedVE[VE]].prefix);
    }
    
    prefixes = [...new Set(prefixes)];

    ///// OUTER WHERE /////

    // Inner SELECT and GROUP BY
    let source,dest;
    for(let dimension in vistitedEdges){
      const dim = vistitedEdges[dimension];
      
      if (dim[0][1]==='ru'){
        source = this.state.virtualEntities[dim[0][0]].entity.signature[0].fieldName;
      }
      else{
        source = this.state.virtualEntities[dim[0][0]].entity.signature[1].fieldName;
      }
      if (dim[dim.length-1][1]==='ru'){
        dest = this.state.virtualEntities[dim[dim.length-1][0]].entity.signature[1].fieldName;
      }
      else{
        dest = this.state.virtualEntities[dim[dim.length-1][0]].entity.signature[0].fieldName;
      }
      
      select = select.split(source).join(dest)
      groupBy = groupBy.split(source).join(dest)
    }

    
    // Inner WHERE
    for(let i in dividedCodeVE){
      // let ve = this.state.virtualEntities[visitedVE[i]].entity.;
      where = where.concat('.').concat(dividedCodeVE[i]['where'])
    }
    const innerCode = this.codeByObject({'where':where,'select':select,'groupBy':groupBy});
    
    ///// OUTER SELECT /////
    
    // dimensions with hierarchies -> all
    const measures = this.state.formData.measures;
    select = Object.keys(dimensionsWHier).map(item => '?'+item);

    // dimensions without hierarchies -> only those checked
    
    const dimensionsWOHier = this.state.formData.dimension;
    if (dimensionsWOHier!==undefined){
      select = select.concat(Object.keys(dimensionsWOHier).filter(item => dimensionsWOHier[item]===true).map(item=> '?'+item))
    }

    groupBy = 'GROUP BY ' + select.join(' ');

    // measures -> only those checked
    for(let measure in measures){
      const meas = measures[measure];
      if (this.state.clickedMeasures.includes(measure)){
        select.push('('+meas['newMeasureOperation']+'(?'+measure+') as ?'+meas['newMeasureOperationName']+')')
      }
    }

    select = 'SELECT DISTINCT '+ select.join(' ');


    const operationalcode = this.codeByObject({'where':innerCode.split('\n'),'select':select,'groupBy':groupBy, 'prefix':prefixes});
    console.log(operationalcode)

    let dimensionsWithHierarchies = {};

    if (toSave===true){
      let rollup = [];
      let drilldown = [];
      let measures = [];
      if (dimensionsWOHier!==undefined){
        let rollupNoHier = Object.keys(dimensionsWOHier).filter(item => dimensionsWOHier[item]===false)
        let remainingDime = Object.keys(dimensionsWOHier).filter(item => dimensionsWOHier[item]!==false)
        for(let i in rollupNoHier){
          rollup.push([rollupNoHier[i]])
        }

        for(let i in remainingDime){
          dimensionsWithHierarchies[remainingDime[i]]={'name':remainingDime[i]}
        }
      }
    

      for(let dim in this.state.formData.dimensions){
        if(this.state.formData.dimensions[dim]['hierarchyDim']!==this.state.formData.dimensions[dim]['newHierarchyDimension']){
          if (vistitedEdges[dim][0][1]==='ru'){
            rollup.push([
              this.state.formData.dimensions[dim]['name'],
              this.state.formData.dimensions[dim]['newHierarchyDimension'],
              this.state.formData.dimensions[dim]['hierarchy']
            ])
          }
          else{
            drilldown.push([
              this.state.formData.dimensions[dim]['name'],
              this.state.formData.dimensions[dim]['newHierarchyDimension'],
              this.state.formData.dimensions[dim]['hierarchy']
            ])
          }
        }
        dimensionsWithHierarchies[this.state.formData.dimensions[dim]['name']]={
          'name':this.state.formData.dimensions[dim]['name'],
          'hierarchyDim':this.state.formData.dimensions[dim]['newHierarchyDimension'],
          'hierarchy':this.state.formData.dimensions[dim]['hierarchy']
        }
      }

      for (let meas in this.state.formData.measures){
        const singMeas = this.state.formData.measures[meas];
        if (singMeas['newMeasureOperation']!==undefined){
          measures.push([
            meas,
            singMeas['newMeasureOperationName'],
            singMeas['newMeasureOperation']
          ])
        }
      }

      const derivedCube={
        name:derivedCubeName,
        baseDataCube:this.state.cube.name,
        rollup:rollup,
        drilldown:drilldown,
        measures:measures,
        dimensions:dimensionsWithHierarchies,
        cubeCode:'',
        sparqlCode:operationalcode
      }
      postDerivedCube(
        this.props.match.params.ontologyName,
        decodeURIComponent(this.props.match.params.ontologyVersion),
        derivedCube,
        () => this.props.addDerivedCube(derivedCubeName)
      );

      // console.log(derivedCube)
      
    }

    this.runQuery(operationalcode,this.state.endpoints)
    this.setState({ visibleHierarchyOperation: false})


  } 

  handleFormSubmit = (data) => {
    // Store the form data in the state
    if (this.state.clickedMeasures.length>0){

      this.setState({ formData: data, isModalVisible: true });
      console.log(this.formRefHier.current.getFieldsValue())
    }
    else{
      message.error('You have to select at least a measure')
    }
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

  getHierarchiesAvailableNodes = (hierarchy,startingNode) => {
    const nodes = this.removePrevious(hierarchy.signature,startingNode)
    
    return nodes;
  }

  // Function to show the confirmation modal

  handleModal = (toSave) => {
    this.handleHierarchiesOperations(toSave,this.state.inputValue)
    this.setState(this.setState({inputValue:'', isModalVisible:false}))


  };

  handleModalCancel = () => {
    // Close the modal and reset user choice
    this.setState({ isModalVisible: false, userChoice: null });
  };

  handleInputChange = (e) => {
    this.setState({
      inputValue: e.target.value,
    });
  };

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

  handleEndpointChange = (endpoint) => {
    this.setState({chosenEndpoint:endpoint})
  }


    
  render() {
    const data = this.state.cube
    
    if (data === null || this.state.loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 36 }}> <Spin size='large' /></div>

    const first = [
      {
        mapKey: "Virtual Entity",
        mapValue: data.virtualEntity
      },
      {
        mapKey: "Description",
        mapValue: data.description
      },
      {
        mapKey: "Body",
        mapValue: data.cubeCode
      }
    ]

    for (let key in data.dimensions){
      const sign = {
            mapKey: "Dimension",
            mapValue: key+ ' over '+data.dimensions[key].veAttribute,
            veAttrib: data.dimensions[key].hierarchy!=undefined?'on hierarchy '+data.dimensions[key].hierarchy:'',
      }
      first.push(sign)
    }
    for (let key in data.measures){
      const sign = {
            mapKey: "Measure",
            mapValue: key+' with operation '+data.measures[key].measureOperation,
            veAttrib: 'over '+data.measures[key].veAttribute,
      }
      first.push(sign)
    }

    if(data.countStar != ''){
      const sign = {
        mapKey: "Measure",
        mapValue: data.countStar+' with operation COUNT(*)'
      }
      first.push(sign)
    }

    const elements = [
      <Card
        size='small'
        className='mappingSQLCard'
        actions={[
          <Tooltip title={this.state.showing_table?'Clear query':'Run'}>
            <div style={{ cursor: 'pointer' }} onClick={() => {
              this.runQuery(this.getCubeRunCode(), this.state.endpoints);
            }}>
              {this.state.showing_table?<FcClearFilters color="white" />:<ThunderboltOutlined />}
              
            </div>
          </Tooltip>
        ]}>
        <ListCubeItem data={first} />
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
        <Drawer  
            title={'Set parameters for new query for cube '+this.state.cube.name}
            visible={this.state.visibleROLAP}
            onClose={() => this.setState({ visibleROLAP: false})}
            destroyOnClose
            width={'50vw'}>
              <Form
                layout='vertical'
                onFinish={this.handleSubmitFilters}
                onClose={() => this.setState({ visibleROLAP: false })}
                ref={this.formRefOper}
              >
                <Form.Item label="Name" name="name" initialValue={this.state.cube.name}>
                  <Input readOnly={true} autoComplete='off' />
                </Form.Item>
                <Form.Item label="Cube Code" name="cubeCode" initialValue={this.state.cube.cubeCode}>
                  <Input.TextArea
                    rows={this.state.cube.cubeCode.split('\n').length - 1}
                    readOnly={true}
                    placeholder='Cube description'
                    autoComplete='off'
                  />
                </Form.Item>
                <Divider orientation="left" plain>
                    Dimensions
                </Divider>
                {/* Map through dimensions and create form elements */}
                {Object.keys(this.state.cube.dimensions).map((dimensionKey) => (
                  <div key={dimensionKey}>
                    <div style={{ width: '25%',display: 'inline-block',marginRight:'5%' }}>
                        <Form.Item label="Dimension Name" name={['dimensions',dimensionKey,'name']} initialValue={dimensionKey}>
                          <Input readOnly={true} placeholder='Cube Dimension Name'/>
                        </Form.Item>
                    </div>
                    <div style={{ width: '20%',display: 'inline-block',marginRight:'5%' }}>
                      <Form.Item label="Operation" name={['dimensions',dimensionKey,'operation']}>
                        <Select onChange={(element) => this.changeOperationDimension(element,dimensionKey)} placeholder='Operation'>
                          {![undefined,"None"].includes(this.state.dimensionsOperation[dimensionKey])?<Select.Option value="None">None</Select.Option>:null}                          
                          <Select.Option value=">">{">"}</Select.Option>
                          <Select.Option value="<">{"<"}</Select.Option>
                          <Select.Option value="=">{"="}</Select.Option>
                          <Select.Option value="!="><span>&#8800;</span></Select.Option>
                          <Select.Option value="<>">{"Between"}</Select.Option>
                          <Select.Option value="><">{"Out of range"}</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>
                    
                    <div style={{ width: '20%',display: 'inline-block',marginRight:'5%' }}>
                      <Form.Item label="Value" name={['dimensions',dimensionKey,'value1']} >
                        <Input disabled={[undefined,"None"].includes(this.state.dimensionsOperation[dimensionKey])} placeholder='Value' required={![undefined,"None"].includes(this.state.dimensionsOperation[dimensionKey])} />
                      </Form.Item>
                    </div>
                    {this.state.dimensionsOperation[dimensionKey]=='<>'||this.state.dimensionsOperation[dimensionKey]=='><'?
                    <div style={{ width: '20%',display: 'inline-block' }}>
                      <Form.Item label="Value" name={['dimensions',dimensionKey,'value2']} >
                        <Input placeholder='Value' required={true}/>
                      </Form.Item>
                    </div>
                    :null}
                    
                  </div>
                ))}
                <Divider orientation="left" plain>
                    Measures
                </Divider>
                {Object.keys(this.state.cube.measures).map((measureKey) => (
                  <div key={measureKey}>
                    <div style={{ width: '25%',display: 'inline-block',marginRight:'5%' }}>
                        <Form.Item label="Measure Name" name={['measures',measureKey,'name']} initialValue={measureKey}>
                          <Input readOnly={true} placeholder='Cube Measure Name'/>
                        </Form.Item>
                    </div>
                    <div style={{ width: '20%',display: 'inline-block',marginRight:'5%' }}>
                      <Form.Item label="Operation" name={['measures',measureKey,'operation']}>
                        <Select onChange={(element) => this.changeOperationMeasure(element,measureKey)} placeholder='Operation'>
                          {![undefined,"None"].includes(this.state.measuresOperation[measureKey])?<Select.Option value="None">None</Select.Option>:null}                          
                          <Select.Option value=">">{">"}</Select.Option>
                          <Select.Option value="<">{"<"}</Select.Option>
                          <Select.Option value="=">{"="}</Select.Option>
                          <Select.Option value="!="><span>&#8800;</span></Select.Option>
                          <Select.Option value="<>">{"Between"}</Select.Option>
                          <Select.Option value="><">{"Out of range"}</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>
                    
                    <div style={{ width: '20%',display: 'inline-block',marginRight:'5%' }}>
                      <Form.Item label="Value" name={['measures',measureKey,'value1']} >
                        <Input disabled={[undefined,"None"].includes(this.state.measuresOperation[measureKey])} placeholder='Value' required={![undefined,"None"].includes(this.state.measuresOperation[measureKey])} />
                      </Form.Item>
                    </div>
                    {this.state.measuresOperation[measureKey]=='<>'||this.state.measuresOperation[measureKey]=='><'?
                    <div style={{ width: '20%',display: 'inline-block' }}>
                      <Form.Item label="Value" name={['measures',measureKey,'value2']} >
                        <Input placeholder='Value' required={true} />
                      </Form.Item>
                    </div>
                    :null}
                    
                  </div>
                ))}

                <Form.Item style={{ textAlign: 'center' }}>
                  <Button
                    onClick={() => this.setState({ visibleROLAP: false })}
                    style={{ marginRight: 8 }}
                  >
                    <FaWindowClose />
                  </Button>
                  <Button htmlType='submit' type="primary">
                    <ThunderboltOutlined />
                  </Button>
                </Form.Item>
              </Form>
        </Drawer>
        <Drawer  
            title={'Define operation over hierarchies for cube '+this.state.cube.name}
            visible={this.state.visibleHierarchyOperation}
            onClose={() => this.setState({ visibleHierarchyOperation: false,  clickedMeasures:[]})}
            destroyOnClose
            width={'50vw'}>
              <Form layout='vertical' ref={this.formRefHier} onFinish={this.handleFormSubmit} onClose={() => this.setState({ visibleHierarchyOperation: false,  clickedMeasures:[], })}>
                  {Object.keys(this.state.cubeDimensions)
                    .filter(dimensionKey => this.state.cubeDimensions[dimensionKey]['hierarchy'] === undefined)
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
                  {Object.keys(this.state.cubeDimensions)
                    .filter(dimensionKey => this.state.cubeDimensions[dimensionKey]['hierarchy'] !== undefined)
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
                                    <Popover content={this.popoverContentHierarchy(this.state.cube.dimensions[dimensionKey]['hierarchy'])} title={null} trigger="click" placement="left">
                                        <BsInfoCircle className="custom-icon" />
                                    </Popover>
                                </span>} 
                          name={['dimensions', dimensionKey, 'hierarchy']} 
                          initialValue={this.state.cube.dimensions[dimensionKey]['hierarchy']}
                        >
                            <Input readOnly={true}/>
                          </Form.Item>
                        </div>

                        <div style={{ width: '20%', display: 'inline-block', marginRight: '5%' }}>
                          <Form.Item label="Starting Dimension" name={['dimensions', dimensionKey, 'hierarchyDim']} initialValue={this.state.cube.dimensions[dimensionKey]['hierarchyDim']}>
                            <Input readOnly={true} />
                          </Form.Item>
                        </div>
                        <div style={{ width: '20%', display: 'inline-block', marginRight: '5%' }}>
                          <Form.Item label="Move on" name={['dimensions', dimensionKey, 'newHierarchyDimension']} initialValue={this.state.cube.dimensions[dimensionKey]['hierarchyDim']}>
                            <Select>
                              {this.state.hierarchies[this.state.cube.dimensions[dimensionKey]['hierarchy']]!= undefined?
                              this.getHierarchiesAvailableNodes(this.state.hierarchies[this.state.cube.dimensions[dimensionKey]['hierarchy']],this.state.cube.dimensions[dimensionKey]['hierarchyDim'])
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
                    .map(measureKey => (
                      <div key={measureKey}>
                        <div style={{ width: '18%', display: 'inline-block', marginRight: '5%' }}>
                          <Form.Item name={['measures', measureKey, 'name']} label='Measure'>
                              <Checkbox  onClick={() => this.handleMeasureCheck(measureKey)}>{measureKey}</Checkbox>
                          </Form.Item>
                        </div>
                          <div style={{ width: '18%', display: 'inline-block', marginRight: '5%' }}>
                          <Form.Item
                            label="Operation"
                            name={['measures', measureKey, 'hierarchy']} 
                            initialValue={this.state.cube.measures[measureKey]['measureOperation']}
                          >
                              <Input readOnly={true}/>
                            </Form.Item>
                          </div>

                          <div style={{ width: '23%', display: 'inline-block', marginRight: '5%' }}>
                            <Form.Item label="New Operation" name={['measures', measureKey, 'newMeasureOperation']} 
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
                            <Form.Item label="Name" name={['measures', measureKey, 'newMeasureOperationName']}
                              rules={[{required: this.state.clickedMeasures.includes(measureKey),message: 'Please define a name.',},
                            ]}
                            >
                              <Input placeholder='Name for measure' disabled={!this.state.clickedMeasures.includes(measureKey)}/>
                            </Form.Item>
                          </div>
                       </div>
                    ))}

                  {this.state.cube.countStar!=''?
                  <div key={this.state.cube.countStar}>
                  <div style={{ width: '18%', display: 'inline-block', marginRight: '5%' }}>
                    <Form.Item name={['measures', this.state.cube.countStar, 'name']} label='Measure'>
                        <Checkbox  onClick={() => this.handleMeasureCheck(this.state.cube.countStar)}>{this.state.cube.countStar}</Checkbox>
                    </Form.Item>
                  </div>
                  <div style={{ width: '18%', display: 'inline-block', marginRight: '5%' }}>
                          <Form.Item
                            label="Operation"
                            name={['measures', this.state.cube.countStar, 'hierarchy']} 
                            initialValue={"COUNT(*)"}
                          >
                              <Input readOnly={true}/>
                            </Form.Item>
                          </div>
                    <div style={{ width: '23%', display: 'inline-block', marginRight: '5%' }}>
                      <Form.Item label="New Operation" name={['measures', this.state.cube.countStar, 'newMeasureOperation']} 
                        rules={[{required: this.state.clickedMeasures.includes(this.state.cube.countStar),message: 'Please select an operation.',},
                        ]}
                      >
                        <Select disabled={!this.state.clickedMeasures.includes(this.state.cube.countStar)}>
                          <Select.Option key={'count'} value={'count'}>COUNT</Select.Option>
                          <Select.Option key={'max'} value={'max'}>MAX</Select.Option>
                          <Select.Option key={'min'} value={'min'}>MIN</Select.Option>
                          <Select.Option key={'sum'} value={'sum'}>SUM</Select.Option>
                          <Select.Option key={'avg'} value={'avg'}>AVG</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>
                    <div style={{ width: '20%', display: 'inline-block' }}>
                      <Form.Item label="Name" name={['measures', this.state.cube.countStar, 'newMeasureOperationName']}
                        rules={[{required: this.state.clickedMeasures.includes(this.state.cube.countStar),message: 'Please define a name.',},
                      ]}
                      >
                        <Input placeholder='Name for measure' disabled={!this.state.clickedMeasures.includes(this.state.cube.countStar)}/>
                      </Form.Item>
                    </div>
                 </div>
                  :null}


                <Form.Item style={{ textAlign: 'center' }}>
                  <Button 
                    onClick={() => this.setState({
                      visibleHierarchyOperation: false, 
                      hierarchyAvailableOper:{'r_u':true,'d_d':true},
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

              <Modal
                title="Do you want to save cube?"
                visible={this.state.isModalVisible}
                onCancel={() => this.setState({ isModalVisible: false, userChoice: null })}
                footer={
                <div>
                  <Button onClick={() => this.handleModal(false)}>Just Run</Button>
                  <Button disabled={this.state.inputValue===''||this.state.inputValue===undefined} onClick={() => this.handleModal(true)}>Run and Save</Button>
                </div>
              }
                style={{ width: '30%', maxHeight: '30%' }}
              >
                <div>
                  <Input
                    placeholder="Define Derived Cube Name"
                    value={this.state.inputValue}
                    onChange={this.handleInputChange}
                  />
                </div>
              </Modal>
        </Drawer>

        <Modal
                title="Select the endpoint?"
                visible={this.state.isSelectedEndpoint}
                onCancel={() => this.setState({ isSelectedEndpoint: false, chosenEndpoint: undefined })}
                footer={
                <div>
                  <Button onClick={() => this.setState({ isSelectedEndpoint: false, chosenEndpoint: undefined })}>Cancel</Button>
                  <Button disabled={this.state.chosenEndpoint===undefined} onClick={() => {
                    this.setState({isSelectedEndpoint: false},() =>{
                      this.runQuery(this.getCubeRunCode(),this.state.endpoints)
                    })
                  }
                    }>Confirm</Button>
                </div>
              }
                style={{ width: '20%', maxHeight: '30%' }}
              >
                <div>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select an endpoint"
                  onChange={this.handleEndpointChange}
                >
                  {this.state.endpoints.map((endpoint) => (
                    <Select.Option key={endpoint.name} value={endpoint.name}>
                      {endpoint.name}
                    </Select.Option>
                  ))}
                </Select>
                </div>
          </Modal>
        </div>
      </div>
    )
  }
}