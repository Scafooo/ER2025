import React from 'react';
import { BsInfoCircle } from "react-icons/bs";
import { Input, Button, Form, Divider, Select, Checkbox, Popover ,message } from 'antd'
import { putCube, getHierarchies, getVirtualEntities} from '../../../api/OntologyApi';


export default class CubeEdit extends React.Component {
    formRef = React.createRef();
    
    state = {

        cube:{},
        measures:[],
        dimensions:[],
        hierarchies:{},
        selectedHierarchies:{},
        hierarchiesNames:[],
        hierarchiesNodes:[],
        ve_attributes:[],
        selectedMeasures:{},
        formMeasures:[],
        incrementMeasures:0,
        VE_Code:'',
        sparqlCode:'',
        selectedCountStar:false,

        // are keys
        keys:[],

        // are nulls
        nulls:[]
    }

    setFields() {
        let cube = this.props.cube; 

        let dime = {};
        // dime['dimension'] =  cube.dimensions
        for (let i = 0; i<cube.valuesDimensions.length;i++){
            const dim = cube.dimensions[cube.valuesDimensions[i][1]];
            const key = cube.valuesDimensions[i][0];
            dime[key]=dim;
        }

        let meas = {};
        // dime['dimension'] =  cube.dimensions
        for (let i = 0; i<cube.valuesMeasures.length;i++){
            const measure = cube.measures[cube.valuesMeasures[i][0]];
            const key = cube.valuesMeasures[i][1];
            meas[key]=measure;
        }

        this.formRef.current.setFieldsValue({
            name: cube.name,
            description: cube.description,
            cubeCode: cube.cubeCode.split('\n').slice(0,cube.cubeCode.split('\n').length-1).join('\n'),
            virtualEntity: cube.virtualEntity,
        })

        let usedHierarchies = [];
        const defaultDimensionValues = {};
        this.state.dimensions.forEach((element) => {
            if (dime[element].hierarchy!==undefined){
                usedHierarchies.push(dime[element].hierarchy)
            }
            defaultDimensionValues[element] = {
                cubeDimensionName: dime[element].cubeDimensionName,
                hierarchy: dime[element].hierarchy,
                hierarchyDim: dime[element].hierarchyDim,
                isKey:dime[element].iskey,
                nullable:dime[element].nullable
            };
        });

        const newhierarchyname = this.state.hierarchiesNames.filter(item => !usedHierarchies.includes(item));
        this.setState({hierarchiesNames:newhierarchyname,selectedCountStar:cube.countStar!==''},() => {
            this.formRef.current.setFieldsValue({
                'countStar': {
                    'VEAttribute':'COUNT(*)',
                    'attributeName':cube.countStar

                }
            })
        })

        
        let arekeys=[];
        let arenulls=[];
        for(let i in this.state.cube.dimensions){
            const dimension = this.state.cube.dimensions[i];
            const veAttr = dimension.veAttribute
            
            if (dimension.iskey){
                arekeys.push(veAttr);
            }
            if (dimension.nullable){
                arenulls.push(veAttr);
            }
        }
        this.setState({keys:arekeys,nulls:arenulls});
        

        const defaultMeasureValues = {};

        this.state.measures.forEach((element,index) => {
            defaultMeasureValues[index] = {
                attributeName: meas[element].cubeMeasureName,
                operation: meas[element].measureOperation,
                VEAttribute: meas[element].veAttribute,
                // Add more fields as needed
            };
        });

            // Set the default values for dimensions
        this.formRef.current.setFieldsValue({ dimension: defaultDimensionValues, measure: defaultMeasureValues });

        
    }

    setVECode(value) {
        const num_rows = value.split('\n').filter(item => item !== '' && !item.startsWith('PREFIX'));
        return (num_rows.join('\n'));
    }

    getVE() {
        getVirtualEntities(
            this.props.match.params.ontologyName,
            decodeURIComponent(this.props.match.params.ontologyVersion),
            (data) => {
                const code = this.setVECode(data[this.props.cube.virtualEntity].entity['sparqlCode']);

                let hierNodes = {}
                for(let i = 0; i<data[this.props.cube.virtualEntity].entity['signature'].length;i++){
                    hierNodes[data[this.props.cube.virtualEntity].entity['signature'][i]['fieldName']]=[];
                }

                let valdim = [];
                for (let key in this.props.cube.valuesDimensions){
                    valdim.push(this.props.cube.valuesDimensions[key][0]);
                }

                let valmeas = [];
                let selMeas = {}
                for (let key in this.props.cube.valuesMeasures){
                    valmeas.push(this.props.cube.valuesMeasures[key][1]);
                    selMeas[key] = this.props.cube.valuesMeasures[key][1];
                    this.handleAddMeasure()
                }

                let veatt =[] 
                for(let key in data[this.props.cube.virtualEntity].entity.signature){
                        veatt.push(data[this.props.cube.virtualEntity].entity.signature[key]['fieldName'])
                }

                let selHier = {}
                for(let i in veatt){
                    for (let j in this.props.cube.dimensions){
                        if (veatt[i]===this.props.cube.dimensions[j]['veAttribute'] && this.props.cube.dimensions[j]['hierarchy']!==undefined){
                            selHier[this.props.cube.dimensions[j]['veAttribute']] = this.props.cube.dimensions[j]['hierarchy'];
                            hierNodes[this.props.cube.dimensions[j]['veAttribute']] = this.state.hierarchies[this.props.cube.dimensions[j]['hierarchy']]['nodes'];
                            break
                        }
                    }
                    
                }



                this.setState({
                    cube:this.props.cube,
                    measures:valmeas,
                    dimensions:valdim,
                    ve_cube:data[this.props.cube.virtualEntity],
                    VE_Code:code,
                    sparqlCode:data[this.props.cube.virtualEntity].entity['sparqlCode'],
                    ve_attributes:veatt,
                    selectedHierarchies:selHier,
                    hierarchiesNodes:hierNodes,
                    selectedMeasures:selMeas,
                    checked_attrib:valdim
                },() => {this.setFields()});
                
            }
          );
    }

    submit = (values) => {
        let dim = {};
        let meas = {};

        let dimVal = [];
        for (let key in values.dimension){
            const name = values.dimension[key]['cubeDimensionName'];
            if (name !== undefined){
                const hier = values.dimension[key]['hierarchy'];
                const hierDim = values.dimension[key]['hierarchyDim'];
                const iskey = values.dimension[key]['isKey']===undefined?false:values.dimension[key]['isKey'];
                const nullable = values.dimension[key]['nullable']===undefined?false:values.dimension[key]['nullable'];
                if(hier === undefined || hierDim === undefined){
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
        else if (values.measure === undefined && this.state.selectedCountStar === false){
            message.warn('You have to set at least a measure')
        }
        else{
            let measVal=[];
            if(values.measure){
                for (let i = 0; i<values.measure.length;i++){
                    if (values.measure[i]!== undefined){
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
                  name:this.state.cube.name,
                  description:values.description,
                  virtualEntity:values.virtualEntity,
                  cubeCode:'',
                  sparqlCode:this.state.sparqlCode,
                  dimensions:dim,
                  measures:meas,
                  valuesDimensions:dimVal,
                  valuesMeasures:measVal,
                  countStar:countStar
            }

            putCube(
                this.props.match.params.ontologyName,
                decodeURIComponent(this.props.match.params.ontologyVersion),
                cube,
                () => window.location.reload()
            );
            // DEFINE POST CUBE
            this.props.close()
        }

    }

    getHierarchy(){
        getHierarchies(
            this.props.match.params.ontologyName,
            decodeURIComponent(this.props.match.params.ontologyVersion),
            (data) => {
                this.setState({hierarchies:data,hierarchiesNames:Object.keys(data)});
                this.getVE();
            }
        )
    }
    
    componentDidMount() {
        this.getHierarchy();
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

    handleSelectHierarchy = (itemID, data, element) => {

        // Aggiungo il valore precedentemente selezionato
        let temp_list = this.state.hierarchiesNames;
        if (this.state.selectedHierarchies[element]!==undefined){
            temp_list.push(this.state.selectedHierarchies[element]);
        }

        this.state.selectedHierarchies[element] = data;
        this.state.hierarchiesNodes[element]=this.state.hierarchies[data]["nodes"];

        this.setState({hierarchiesNames:temp_list.filter(item => item!==data)});

        this.formRef.current.setFieldsValue({
            ['dimension']: {
                [element]:{
                    'hierarchyDim':undefined
                }
            }
          });

    }

    change_eval = (element,value,index) => {
        // Use the setState function to update the state
        this.setState((prevState) => {
          const updatedState = {
            dimensions: value
              ? [...prevState.dimensions, element]
              : prevState.dimensions.filter((item) => item !== element),
          };
        
        
          if (!value) {
            updatedState.checked_attrib = this.state.checked_attrib.filter(item => item !== element)

            updatedState.selectedHierarchies = {
              ...prevState.selectedHierarchies,
              [index]: undefined,
            };
            updatedState.hierarchiesNodes = {
              ...prevState.hierarchiesNodes,
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
          else{
            const checat = this.state.checked_attrib;
            checat.push(element);
            updatedState.checked_attrib = checat;
          }
      
          return updatedState;
        });
    }

    handleSelectMeasure = (itemID, data) => {
        const temp_list_checkAttr = this.state.checked_attrib.filter(item => item !== data)
        
        // ESTRARRE INDEX DI data FROM ve_attributes
        const val = this.state.ve_attributes.filter(item => !this.state.measures.includes(item)).map((element, index) =>[element,index]).filter(item => item[0]===data)[0]
        const index = val[1];
        

        const previousVal = this.state.selectedMeasures[itemID]
        let temp_list;
        if (this.state.selectedMeasures[itemID]===undefined){
            temp_list = this.state.measures;
            
        }
        else{
            
            temp_list = this.state.measures.filter(item => item !== previousVal)

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


                if (prevState.selectedHierarchies[data] !== undefined){
                    updatedHierarchiesNames.push(prevState.selectedHierarchies[data]);
                }

                const updatedSelectedHierarchies = { ...prevState.selectedHierarchies };
                updatedSelectedHierarchies[index] = undefined;
              
                const updatedHierarchyNodes = { ...prevState.hierarchiesNodes };
                updatedHierarchyNodes[index] = [];
              
                return {
                  measures: updatedMeasures,
                  checked_attrib: updatedCheckedAttrib,
                  hierarchiesNames: updatedHierarchiesNames,
                  selectedHierarchies: updatedSelectedHierarchies,
                  hierarchiesNodes: updatedHierarchyNodes,
                };
              });
              

        }
        else{
            this.setState({measures:temp_list, checked_attrib:temp_list_checkAttr})
        }
    }


    handleAddMeasure = () => {
        const newItem = this.state.formMeasures.concat({ id: this.state.incrementMeasures });
        this.setState({
            formMeasures: newItem,
            incrementMeasures:this.state.incrementMeasures+1
        },() => {console.log(this.state.measures)});
    };

    handleRemoveLine = (itemID) => {
        let temp_list;
        if (this.state.selectedMeasures[itemID]!==undefined){
            const previousVal = this.state.selectedMeasures[itemID]
            temp_list = this.state.measures.filter(item => item !== previousVal)
        }
        else{
            temp_list = this.state.measures
        }


        const updatedItems = this.state.formMeasures.filter((item) => item.id !== itemID);
        this.setState({
            formMeasures: updatedItems,
            measures:temp_list
        });
    }

    handleCountStar = () => {
        const cstar = this.state.selectedCountStar;
        this.setState({selectedCountStar:!cstar})
    }



    render() {
        return(
            <div>
            <Form layout='vertical' onFinish={this.submit} ref={this.formRef}>
                <Form.Item label="Name"
                    name="name"
                    rules={[
                        { required: true, message: "Please select SQL view name" },
                    ]}
                >
                    <Input readOnly={true}/>
                </Form.Item>

                <Form.Item label="Description"
                    name="description"
                >
                    <Input placeholder='Cube description' autoComplete='off' />
                </Form.Item>

                <Form.Item label="Cube Code"
                    name="cubeCode"
                >
                    <Input.TextArea rows={this.props.cube.cubeCode!==undefined?this.props.cube.cubeCode.split('\n').length-1:null} readOnly={true} placeholder='Cube description' autoComplete='off' />
                </Form.Item>
                
                <div>
                    <div style={{width:'70%',display: 'inline-block', marginRight:'15%'}}>
                        <Form.Item name='virtualEntity' label='Virtual Entity' rules={[{ required: true }]}>
                            <Input readOnly={true}/>
                        </Form.Item>
                    </div>

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
                </div>
                <Divider orientation="left" plain>
                    Dimensions
                </Divider>
                {this.state.ve_attributes.filter(item => !this.state.measures.includes(item)).map((element, index) => (
                        <div key={index}>
                            {/* CHECKBOX */}
                            <div style={{ width: '16%',display: 'inline-block',marginRight:'4%' }}>
                            <Form.Item name={['dimension', element, 'cubeDimensionName']} label='Virtual Entity attribute'>
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
                                <Form.Item name={['dimension', element, 'cubeDimensionName']} label=' ' >
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
                                             {/* <Popover content={this.popoverContentHierarchy(index)} title={null} trigger="click" placement="left">
                                                <BsInfoCircle className="custom-icon" />
                                            </Popover>  */}
                                        </span>
                                    }
                                    >
                                    <Select disabled={!this.state.checked_attrib.includes(element)} onChange={(selectedOption) => this.handleSelectHierarchy(index, selectedOption, element)}
                                    >
                                            {this.state.hierarchiesNames.map((option) => (
                                            <Select.Option key={option} value={option} >
                                                {option}
                                            </Select.Option>
                                            ))}
                                    </Select>
                                </Form.Item>
                            </div>

                            {/* SELECT HIERARCHY DIMENSION */}
                            <div style={{ width: '16%',display: 'inline-block',marginRight:'3%'}}>
                                <Form.Item name={['dimension', element, 'hierarchyDim']} label="Attribute" rules={[{ disabled: true }]}>
                                    <Select disabled={!this.state.checked_attrib.includes(element)}>
                                        {this.state.hierarchiesNodes[element].map((option) => (
                                            <Select.Option key={option} value={option}>
                                                {option}
                                            </Select.Option>
                                            ))}                                         

                                    </Select>
                                </Form.Item>
                            </div>
                            
                            {/* DIMENSION is KEY */}
                            {/* default checked, passa a una funzione element che ritorna True of False */}
                            <div style={{ width: '8%',display: 'inline-block',marginRight:'3%'}}>
                                <Form.Item name={['dimension', element, 'isKey']} label="is Key" valuePropName="checked">
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
                <div>
                <Divider orientation="left" plain>
                    Measures
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