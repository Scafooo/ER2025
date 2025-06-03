import React from 'react';
import { Menu, Input, Button, Drawer, Form, Popconfirm, Layout, Spin, Select, Checkbox, message, Modal } from 'antd'
import { PlusOutlined,} from '@ant-design/icons'
import { deleteAuhtorizationViewProfile, getAuhtorizationViewProfiles, getOntologyEntities, postCube, getCubes, getCube, postAuhtorizationViewProfiles, putAuhtorizationViewProfile, getVirtualEntities } from '../../../api/OntologyApi';
import MonolithEmpty from '../../components/MonolithEmpty';
import CubePage from './CubePage';
import CubeEdit from './CubeEdit';
import CubeAdd from './CubeAdd';
import CubeModalHierarchies from './CubeModalHierarchies';

const {
  Sider,
  Content,
} = Layout;

export default class CubeLayout extends React.Component {
  _isMounted = true;
  state = {
    visibleEdit: false,

    loading: true,
    searchTerm: '',
    data: [],
    cube_code: '',

    needed_id:0,
    
    increment_id:1,

    show_btn:false,

    StoredCubes:[],

    // Chosen VE
    VE_chosen:'',

    // attributes of the selected Virtual Entity
    VE_parameters: [],
    
    // chosen cube parameters
    cube_paramters:[],
    
    // Qualcosa per tenere traccia degli elementi aggiunti
    selects_parameters:[],
    // visibleDrawer: true
    selectedValue:null,

    // chosen aggregation attribute
    aggregation_attr:'',

    // checked attributes
    checked_attrib:[],

    // cube to study a single page
    chosen_cube:null,

    // cube used for edit
    edit_cube_entity:null,

    // is modal open?
    modalOpen: false,

    // is cube modified?
    addedHierarchies: false,

    // items for searching
    menuItems:[]

  };

  componentDidMount() {
        
    getCubes(
      this.props.match.params.ontologyName,
      decodeURIComponent(this.props.match.params.ontologyVersion),
      this.loaded2
    );

  };


  loaded2 = (cubes) => {

    this.setState({
      StoredCubes: Object.keys(cubes).sort()
    },() =>{
      this.state.menuItems = this.state.StoredCubes.map(item => this.getMenuItem(item)).sort();
      this.setState({loading:false})
    })

  };


  toggleDrawer = () => {
    this.setState({ 
      visibleDrawer: !this.state.visibleDrawer,
      AddDrawer:<CubeAdd
        {...this.props}
        close={() => this.setState({
          visibleDrawer: false
        })}
      />
    })
  };

  editToggleDrawer = () => {
    this.setState({ visibleEdit:!this.state.visibleEdit})
  };


  submit = (values) => {

    console.log(values)
    // retrieve informations
    const VE_name = values.VirtualEntity.split('!!!---')[0];
    const VE_Code = values.VirtualEntity.split('!!!---')[1];
    const cn = values.CubeName;
    let aggregation_attribute = undefined;
    let aggregation_operation = undefined;
    let cube_attributes = [];
    let ve_attributes = [];
    const description = values.description;
    this.setState({cube_Name:cn})
    // gestire gli attributi non di aggregazione
    for (const key in values) {
      if(key.startsWith('Cb_Attr')){
        const spl_key= key.split('--');
        if (values[key] != undefined) {
          ve_attributes.push(spl_key[1]);
          cube_attributes.push(values[key]);
        }
      }
      if(key.startsWith('AggregationOp')){
        aggregation_operation = values[key]
      }
      if(key.startsWith('AggregationAttr')){
        aggregation_attribute = values[key]
      }
    }
    
    if (cube_attributes.length == 0){
      message.warn('You have to select at least an attribute for cube')
      this.toggleDrawer()
    }
    else{
      const cube = {
        entity:{
          name:cn,
          description:description,
          virtualEntity:VE_name,
          cubeCode:'',
          veattributes:ve_attributes,
          cubeAttributes:cube_attributes,
          aggregationAttribute:aggregation_attribute,
          aggregationOperation:aggregation_operation,
        }
      }

      
      this.setState({
        modalOpen:true,
        modalHierarchies: <CubeModalHierarchies 
          {...this.props}
          cube = {cube}
          toggleModal = {this.toggleModal}
          pageReload = {() => window.location.reload()}
        />
      })
    }

  };


  toggleEdit = (data) => {
    this.setState({
      visibleEdit:true,
      drawer: <CubeEdit
      {...this.props}
      cube={data}
      // success={this.success}
      close={() => this.setState({
        visibleEdit: false
      })}
    />})
  
  };
  
  setVECode(value) {
    var s = document.getElementById('VE_Code');
    const num_rows = value.split('!!!---')[1].split('\n').filter(item => item !== '' && !item.startsWith('PREFIX'));
    const setvals = value.split('!!!---')[1].split('\n').filter(item => item.startsWith('SELECT'))[0].split(' ').filter(item => item !== '' && item !== 'SELECT' && item !== 'DISTINCT').map((item) => item.replace('?', ''))
    if (num_rows.join('\n') != this.state.cube_code){
      this.setState(({ VE_parameters:setvals , cube_code:num_rows.join('\n'), selects_parameters: [], cube_paramters:[], increment_id:this.state.increment_id+1,selectedValue:value.split('!!!---')[0],VE_chosen:value.split('!!!---')[0], needed_id: this.state.needed_id+1, aggregation_attr:'', checked_attrib:[] }),() => { 
        s.value = num_rows.join('\n');
        s.rows=num_rows.length;
        console.log('these are setvals '+this.state.needed_id)
        
      });
    }
    
  };

  // handle the click 
  handleMenuClick = (item) => {
    this.setState({ chosen_cube: item });
  };

  getMenuItem = (item) => {
    return (
      {
        key:item,
        label:item
      }
    );
  };

  setCubeParameters(value) {
    console.log(value)
  };

  toggleModal = () => {
    this.setState({modalOpen:!this.state.modalOpen})
    this.toggleDrawer()
  }

  handleSearchInputChange = (data) =>{
    
    const filteredMenuItems = this.state.StoredCubes
      .filter(item => item.toLowerCase().includes(data.target.value.toLowerCase()))
      .map(item => this.getMenuItem(item))
      .sort();
    this.setState({menuItems:filteredMenuItems});
  }

  render() {
    const button = <Button
      style={{ backgroundColor: 'transparent', marginLeft: 4 }}
      onClick={this.toggleDrawer}
      icon={<PlusOutlined />}
      shape='circle' />


    // const menuItems = this.state.StoredCubes.map(item => this.getMenuItem(item)).sort();
    

    return (
      this.state.loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 36 }}> <Spin size='large' /></div> :
        <Layout style={{ height: 'calc(100vh - 48px)', overflow: 'auto' }}>
          

          <Drawer title={'Add Cube'}
            visible={this.state.visibleDrawer}
            onClose={() => this.setState({ visibleDrawer: false })}
            destroyOnClose
            keyboard={false}
            width={'60vw'}>
            {this.state.AddDrawer} 
          </Drawer>

          <Drawer maskClosable={false} title={'Edit Cube'}
            visible={this.state.visibleEdit}
            onClose={() => this.setState({ visibleEdit: false })}
            destroyOnClose
            keyboard={false}
            width={'50vw'}>
            {this.state.drawer} 
          </Drawer>
          <Sider
            className='thirdMenu mastroEndpoint'
            collapsed={this.state.collapsed}
            width="200"
            style={{ padding: 4 }}
          >
            <div style={{ display: 'flex' }}>
              <Input allowClear onChange={this.handleSearchInputChange} placeholder='Search Cube' />
              {button}
            </div>
            
            <Menu
              style={{ backgroundColor: 'transparent' }}
              theme='dark'
              mode='inline'
              items={this.state.menuItems}
              onClick={({ key }) => {this.handleMenuClick(key)}}
            >
              
            </Menu>
          </Sider>
          <Layout>
            <Content>
              <div style={{ padding: 8 }}>
                {this.state.chosen_cube?
                  <CubePage
                    {...this.props}
                    edit={this.toggleEdit}
                    chosen_cube={this.state.chosen_cube}
                  />
                  : 
                  <MonolithEmpty message={'Create or Choose a Cube'}>{button}</MonolithEmpty>}
              </div>
            </Content>
          </Layout>
        </Layout>
    )
  }
}
