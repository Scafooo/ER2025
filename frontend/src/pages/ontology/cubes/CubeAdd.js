import React from 'react';
import { BsInfoCircle } from "react-icons/bs";
import { Menu, Input, Button, Drawer, Form, Popconfirm, Layout, Spin, Select, Checkbox, Modal, Popover, Divider, message } from 'antd'
import TextArea from 'antd/lib/input/TextArea';
import { deleteAuhtorizationViewProfile, getHierarchies, postCube, getVirtualEntities, getEntity } from '../../../api/OntologyApi';
import HierarchyVisualization from './HierarchyVisualization';


export default class CubeAdd extends React.Component {
    formRef = React.createRef();
    
    state = {
        virtualEntities: {},
        virtualEntitiesKeys: [],
        VE_Code: '',
        ve_attributes: [],
        measures:[],
        checked_attrib: [],
        formMeasures:[],
        incrementMeasures:0,
        hierarchies:{},
        hierarchiesNames:[],
        selectedMeasures:{},
        hierarchyNodes:{},
        selectedHierarchies:{},
        selectedCountStar:false
      };

    componentDidMount() {
        getHierarchies(
            this.props.match.params.ontologyName,
            decodeURIComponent(this.props.match.params.ontologyVersion),
            (data) => {
                this.setState({hierarchies:data,hierarchiesNames:Object.keys(data)})
            }
        )

        getVirtualEntities(
            this.props.match.params.ontologyName,
            decodeURIComponent(this.props.match.params.ontologyVersion),
            (data) => {
                this.setState({virtualEntities:data,virtualEntitiesKeys:Object.keys(data)})
            }
        )
    }

    submit = (values) => {
        let dim = {};
        let meas = {};

        let dimVal = [];
        let x = false;
        for(let key in values.dimensions){
            if (values.dimension[key]['isKey']===true){
                x = true;
                break;
            }
        }


        for (let key in values.dimension){
            const name = values.dimension[key]['cube_attribute_name'];
            if (name != undefined){
                const hier = values.dimension[key]['hierarchy'];
                const hierDim = values.dimension[key]['hierarchydim'];
                let iskey = false;
                if(x === false){
                    iskey = true;
                }
                else if(values.dimension[key]['isKey']===undefined){
                    iskey = false;
                }
                else{
                    iskey = values.dimension[key]['iskey'];
                }
                // const iskey = values.dimension[key]['isKey']===undefined?false:values.dimension[key]['isKey'];
                const nullable = values.dimension[key]['nullable']===undefined?false:values.dimension[key]['nullable'];
                if(hier == undefined || hierDim == undefined){
                    dim[name]= {
                        'veAttribute':key,
                        'cubeDimensionName':name,
                        'iskey':iskey,
                        'nullable':nullable
                    }
                    dimVal.push([key,name,'','',iskey,nullable])
                }
                else{

                    dim[name]= {
                        'veAttribute':key,
                        'cubeDimensionName':name,
                        'hierarchy':hier,
                        'hierarchyDim':hierDim,
                        'iskey':iskey,
                        'nullable':nullable
                    }
                    dimVal.push([key,name,hier,hierDim,iskey,nullable])
                }
            }
        }


        if (Object.keys(dim).length<1){
            message.warn('You have to set at least a dimension')
        }
        else if (values.measure == undefined && this.state.selectedCountStar === false){
            message.warn('You have to set at least a measure')
        }
        else{
            let measVal=[];
            if(values.measure){
                for (let i = 0; i<values.measure.length;i++){
                    if (values.measure[i]!= undefined){
                        meas[values.measure[i]['attributeName']] = {
                            'veAttribute':values.measure[i]['VEAttribute'],
                            'cubeMeasureName':values.measure[i]['attributeName'],
                            'measureOperation':values.measure[i]['operation']
                        }
                        measVal.push([
                            values.measure[i]['attributeName'],
                            values.measure[i]['VEAttribute'],
                            values.measure[i]['operation']
                        ])
                    }
                }
            }
            let countStar = ''; 
            if(this.state.selectedCountStar === true && values.countStar){
                countStar = values.countStar.attributeName;
            }


    
            const cube = {
                  name:values.CubeName,
                  description:values.description,
                  virtualEntity:values.VirtualEntity,
                  cubeCode:'',
                  sparqlCode:this.state.virtualEntities[values.VirtualEntity].entity['sparqlCode'],
                  dimensions:dim,
                  measures:meas,
                  valuesDimensions:dimVal,
                  valuesMeasures:measVal,
                  countStar:countStar
            }

            postCube(
                this.props.match.params.ontologyName,
                decodeURIComponent(this.props.match.params.ontologyVersion),
                cube,
                () => window.location.reload()
            );
            this.props.close()
        }

        


    }

    popoverContent = () => {
        return (
            <div>
                <div style={{ backgroundColor: '#14202B', whiteSpace: 'pre-line' }}>
                    {this.state.VE_Code}
                </div>
            </div>
        )
    }

    popoverContentHierarchy = (data) => {
        if (this.state.selectedHierarchies[data]!=undefined){
            let edges=[];
            const hier = this.state.hierarchies[this.state.selectedHierarchies[data]].signature
            
            for (let i = 0; i<hier.length;i++){
                edges.push([hier[i]["input1"],hier[i]["input2"]])
            }
            
            
            return(<div style={{ width: '500', height: '400' }}>
                 <HierarchyVisualization nodesHier={edges} />

            </div>)
        }
        else{
            return(<div>
                Please select a Hierarchy
            </div>)
        }
    }

    setVECode(value) {
        const num_rows = value.split('\n').filter(item => item !== '' && !item.startsWith('PREFIX'));
        return (num_rows.join('\n'));
    }

    resetValues(veAttributes){
        this.state.hierarchyNodes={}
        for(let i = 0; i<veAttributes.length;i++){
            this.state.hierarchyNodes[i]=[];
        }
        this.formRef.current.setFieldsValue({
            ['dimension']: undefined,
            ['measure']: undefined,
          });
        this.setState({checked_attrib:[],hierarchiesNames:Object.keys(this.state.hierarchies),selectedHierarchies:{}})
    }

    // Change Virtual Entity
    handleSelectChange = (value) => {
        const veAttributes = this.state.virtualEntities[value].entity['signature'].map(
          (signatureItem) => signatureItem['fieldName']
        );

        this.resetValues(veAttributes)

        
    
        this.setState({ ve_attributes: veAttributes }, () => {
            const code = this.setVECode(this.state.virtualEntities[value].entity['sparqlCode']);
            this.setState({ VE_Code: code },() =>{
                this.removeLines()
            });
        });
    };

    handleAddMeasure = () => {
        const newItem = this.state.formMeasures.concat({ id: this.state.incrementMeasures });
        this.setState({
            formMeasures: newItem,
            incrementMeasures:this.state.incrementMeasures+1
        },() => {console.log(this.state.measures)});
    };

    handleSelectMeasure = (itemID, data) => {
        const temp_list_checkAttr = this.state.checked_attrib.filter(item => item != data)
        
        // ESTRARRE INDEX DI data FROM ve_attributes
        const val = this.state.ve_attributes.filter(item => !this.state.measures.includes(item)).map((element, index) =>[element,index]).filter(item => item[0]==data)[0]
        const index = val[1];
        
        let temp_list;
        if (this.state.selectedMeasures[itemID]==undefined){
            temp_list = this.state.measures;
            
        }
        else{
            const previousVal = this.state.selectedMeasures[itemID]
            temp_list = this.state.measures.filter(item => item != previousVal)

        }
        temp_list.push(data);
        this.state.selectedMeasures[itemID] = data

        this.formRef.current.setFieldsValue({
            ['dimension']: {
              [data]: undefined,
            },
          });
        if (this.state.checked_attrib.includes(data)){

            this.setState((prevState) => {
                const updatedMeasures = temp_list;
                const updatedCheckedAttrib = temp_list_checkAttr;
              
                let updatedHierarchiesNames = [...prevState.hierarchiesNames];
                if (prevState.selectedHierarchies[index] != undefined){
                    updatedHierarchiesNames.push(prevState.selectedHierarchies[index]);
                }

                const updatedSelectedHierarchies = { ...prevState.selectedHierarchies };
                updatedSelectedHierarchies[index] = undefined;
              
                const updatedHierarchyNodes = { ...prevState.hierarchyNodes };
                updatedHierarchyNodes[index] = [];
              
                return {
                  measures: updatedMeasures,
                  checked_attrib: updatedCheckedAttrib,
                  hierarchiesNames: updatedHierarchiesNames,
                  selectedHierarchies: updatedSelectedHierarchies,
                  hierarchyNodes: updatedHierarchyNodes,
                };
              });
              

        }
        else{
            this.setState({measures:temp_list, checked_attrib:temp_list_checkAttr})
        }
    }

    handleSelectHierarchy = (itemID, data, element) => {

        let temp_list = this.state.hierarchiesNames;
        if (this.state.selectedHierarchies[itemID]!=undefined){
            temp_list.push(this.state.selectedHierarchies[itemID]);
        }

        this.state.selectedHierarchies[itemID] = data;
        this.state.hierarchyNodes[itemID]=this.state.hierarchies[data]["nodes"];
        this.setState({hierarchiesNames:temp_list.filter(item => item!=data)});

        this.formRef.current.setFieldsValue({
            ['dimension']: {
                [element]:{
                    'hierarchydim':undefined
                }
            }
          });

    }

    // ADD Checked Attribute in  checked_attrib
    change_eval = (element, value, index) => {
        // Use the setState function to update the state
        this.setState((prevState) => {
          const updatedState = {
            checked_attrib: value
              ? [...prevState.checked_attrib, element]
              : prevState.checked_attrib.filter((item) => item !== element),
          };
      
          if (!value) {
            updatedState.selectedHierarchies = {
              ...prevState.selectedHierarchies,
              [index]: undefined,
            };
            updatedState.hierarchyNodes = {
              ...prevState.hierarchyNodes,
              [index]: [],
            };
      
            // Add oldSelectedHierarchy to hierarchiesNames if it's not already present
            const oldSelectedHierarchy = prevState.selectedHierarchies[index];
            if (
              oldSelectedHierarchy &&
              !prevState.hierarchiesNames.includes(oldSelectedHierarchy)
            ) {
              updatedState.hierarchiesNames = [
                ...prevState.hierarchiesNames,
                oldSelectedHierarchy,
              ];
            }
      
            // Use setFieldValues to set the value to undefined for the specific field
            this.formRef.current.setFieldsValue({
              ['dimension']: {
                [element]: undefined,
              },
            });
          }
      
          return updatedState;
        });
    };      

    removeLines = () => {
        this.setState({formMeasures:[],measures:[],hierarchiesNames:Object.keys(this.state.hierarchies),checked_attrib:[]})
    }

    handleRemoveLine = (itemID) => {
        let temp_list;
        if (this.state.selectedMeasures[itemID]!=undefined){
            const previousVal = this.state.selectedMeasures[itemID]
            temp_list = this.state.measures.filter(item => item != previousVal)
        }
        else{
            temp_list = this.state.measures
        }

        let temp_list_hier = this.state.hierarchiesNames;
        if (this.state.selectedHierarchies[itemID]!=undefined){
            temp_list_hier.push(this.state.selectedHierarchies[itemID]);
        }

        const updatedItems = this.state.formMeasures.filter((item) => item.id !== itemID);
        this.setState({
            formMeasures: updatedItems,
            measures:temp_list
        });
    }

    handleCountStar = () => {
        const cstar = this.state.selectedCountStar;
        this.setState({selectedCountStar:!cstar},() => {
            if (this.state.selectedCountStar){
                this.formRef.current.setFieldsValue({
                    'countStar': {
                        'VEAttribute':'COUNT(*)'
                    }
                })
            }
        })
    }


    
      render() {

        return (
            <div>
            <Form layout='vertical' onFinish={this.submit} ref={this.formRef}>
                <Form.Item name='CubeName' label='Cube Name' rules={[{ required: true }]}>
                    <Input placeholder='Cube Name' />
                </Form.Item>
                <Form.Item name='description' label='Description'>
                    <Input.TextArea />
                </Form.Item>
                <div>
                    <div style={{width:'70%',display: 'inline-block', marginRight:'15%'}}>
                    <Form.Item name='VirtualEntity' label='Virtual Entity' rules={[{ required: true }]}>
                        <Select onChange={this.handleSelectChange}>
                        {this.state.virtualEntitiesKeys.map(item => (
                            <Select.Option key={item} value={item}>
                            {item}
                            </Select.Option>
                        ))}
                        </Select>
                    </Form.Item>
                    </div>
                    {this.state.VE_Code!=''?
                        <div style={{width:'15%',display: 'inline-block'}}>
                        <Form.Item name='VirtualEntityCode' label='Code'>
                            <Popover
                            content={this.popoverContent}
                            title={null}
                            placement="left"
                            >
                                    <BsInfoCircle className="custom-icon"/>
                            </Popover>
                        </Form.Item>
                        </div>
                        :null}
                </div>
                {this.state.VE_Code!=''?
                    <Divider orientation="left" plain>
                        Dimensions
                    </Divider>
                :null}
                {this.state.ve_attributes.filter(item => !this.state.measures.includes(item)).map((element, index) => (
                        <div key={index}>
                        
                            {/* CHECKBOX */}
                            <div style={{ width: '16%',display: 'inline-block',marginRight:'4%' }}>
                            <Form.Item name={['dimension', element, 'VE_attribute_name']} label='Virtual Entity attribute'>
                                <Checkbox checked={this.state.checked_attrib.includes(element)} onChange={(event) => {
                                    if (event.target.checked){
                                    this.change_eval(element,true,index);
                                    }
                                    else {
                                    this.change_eval(element,false,index);
                                    }
                                }}>{element}</Checkbox>
                            </Form.Item>
                            </div>

                            {/* ATTRIBUTE NAME */}
                            <div style={{ width: '18%',display: 'inline-block',marginRight:'5%' }}>
                                <Form.Item name={['dimension', element, 'cube_attribute_name']} label='Dimension Name' >
                                    <Input disabled={!this.state.checked_attrib.includes(element)} required={this.state.checked_attrib.includes(element)} />
                                </Form.Item>
                            </div>

                            {/* SELECT HIERARCHY */}
                            <div style={{ width: '16%',display: 'inline-block',marginRight:'3%' }}>
                                <Form.Item 
                                    name={['dimension', element, 'hierarchy']} 
                                    label={
                                        <span>
                                            Hierarchy{' '}
                                            <Popover content={this.popoverContentHierarchy(index)} title={null} trigger="click" placement="left">
                                                <BsInfoCircle className="custom-icon" />
                                            </Popover>
                                        </span>
                                    }
                                    >
                                    <Select disabled={!this.state.checked_attrib.includes(element)} onChange={(selectedOption) => this.handleSelectHierarchy(index, selectedOption, element)}
                                    >
                                            {this.state.hierarchiesNames.map((option) => (
                                            <Select.Option key={option} value={option}>
                                                {option}
                                            </Select.Option>
                                            ))}
                                    </Select>
                                </Form.Item>
                            </div>

                            {/* SELECT HIERARCHY DIMENSION */}
                            <div style={{ width: '16%',display: 'inline-block',marginRight:'3%'}}>
                                <Form.Item name={['dimension', element, 'hierarchydim']} label="Attribute" rules={[{ disabled: true }]}>
                                    <Select disabled={!this.state.checked_attrib.includes(element)}>
                                            {this.state.hierarchyNodes[index].map((option) => (
                                            <Select.Option key={option} value={option}>
                                                {option}
                                            </Select.Option>
                                            ))}
                                    </Select>
                                </Form.Item>
                            </div>

                            {/* DIMENSION is KEY */}
                            <div style={{ width: '8%',display: 'inline-block',marginRight:'3%'}}>
                                <Form.Item name={['dimension', element, 'isKey']} label="is Part of Key" valuePropName="checked">
                                    <Checkbox/>
                                </Form.Item>
                            </div>

                            {/* DIMENSION is Nullable */}
                            <div style={{ width: '8%',display: 'inline-block',}}>
                                <Form.Item name={['dimension', element, 'nullable']} label="Null" valuePropName="checked">
                                    <Checkbox/>
                                </Form.Item>
                            </div>


                        </div>
                      ))}
                {this.state.VE_Code!=''?
                    <div>
                    <Divider orientation="left" plain>
                        Add Measures
                    </Divider>
                    {this.state.formMeasures.map((item) => (
                        <div key={item.id}>
                            <div style={{ width: '30%',display: 'inline-block',marginRight:'5%' }}>
                                <Form.Item name={['measure', item.id, 'VEAttribute']} label="VE Attribute" rules={[{ required: true }]}>
                                    <Select onChange={(selectedOption) => this.handleSelectMeasure(item.id, selectedOption)}>
                                        {this.state.ve_attributes.filter(item => !this.state.measures.includes(item)).map((option) => (
                                        <Select.Option key={option} value={option} >
                                            {option}
                                        </Select.Option>
                                        ))}
                                        
                                    </Select>
                                </Form.Item>
                            </div>
                            <div style={{ width: '20%',display: 'inline-block',marginRight:'5%' }}>
                                <Form.Item name={['measure', item.id, 'attributeName']} label="Name" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                            </div>
                            <div style={{ width: '20%',display: 'inline-block',marginRight:'5%' }}>
                                <Form.Item name={['measure', item.id, 'operation']} label="Operation" rules={[{ required: true }]}>
                                    <Select onChange={(selectedOption) => console.log(item.id, selectedOption)}>
                                            <Select.Option key={'count'} value={'count'}>COUNT</Select.Option>
                                            <Select.Option key={'max'} value={'max'}>MAX</Select.Option>
                                            <Select.Option key={'min'} value={'min'}>MIN</Select.Option>
                                            <Select.Option key={'sum'} value={'sum'}>SUM</Select.Option>
                                            <Select.Option key={'avg'} value={'avg'}>AVG</Select.Option>
                                    </Select>
                                </Form.Item>
                            </div>
                            <div style={{ width: '5%',display: 'inline-block' }}>
                                <Form.Item name={['measure--'+ item.id+'--button']} label=" ">
                                    <Button shape='circle' onClick={() => this.handleRemoveLine(item.id)}>-</Button>
                                </Form.Item>
                            </div>
                        </div>
                        ))}

                    {/* COUNT STAR */}
                    {this.state.selectedCountStar?
                        <div>
                            <div style={{ width: '30%',display: 'inline-block',marginRight:'5%' }}>
                                <Form.Item name={['countStar', 'VEAttribute']} label="VE Attribute" rules={[{ required: true }]}>
                                <Input
                                    readOnly={true}
                                />
                                </Form.Item>
                            </div>
                            <div style={{ width: '20%',display: 'inline-block',marginRight:'5%' }}>
                                <Form.Item name={['countStar', 'attributeName']} label="Name" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                            </div>
                        </div>
                    :null}
                    <div>
                        {this.state.selectedCountStar?
                            <Button className="countStarColorRem" onClick={this.handleCountStar}>Remove Count(*) Measure</Button>:
                            <Button className="countStarColorAdd" onClick={this.handleCountStar}>Add Count(*) Measure</Button>
                        }
                    </div>
                    <br/>
                    <br/>


                    {this.state.formMeasures.length<this.state.ve_attributes.length?
                        <Button shape='circle' onClick={this.handleAddMeasure}>+</Button>:null}
                    </div>
                :null}

        
                <Form.Item style={{ textAlign: 'center' }}>
                    <Button onClick={this.props.close} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button htmlType='submit' type="primary">
                        Save
                    </Button>
                </Form.Item>
            </Form>
            </div>
        );
      }
    }