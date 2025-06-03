import React from 'react';
import { Menu, Input, Button, Drawer, Form, Popconfirm, Layout, Spin, Select, Checkbox, message } from 'antd'
import { PlusOutlined,MinusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { putCube, deleteAuhtorizationViewProfile, getAuhtorizationViewProfiles, getOntologyEntities, postCube, getCubes, getCube, postAuhtorizationViewProfiles, putAuhtorizationViewProfile, getVirtualEntities } from '../../../api/OntologyApi';
import MonolithEmpty from '../../components/MonolithEmpty';
import CubePage from './CubePage';
import CubeEdit from './CubeEdit';

const {
  Sider,
  Content,
  Footer
} = Layout;

export default class CubeModalHierarchies extends React.Component {
    state = {
        isVisible:true,
        selectedPoints:[],
        loading:true,
        hierarchies:[],
        cubeAttributes:[],
        menuItems:[],
        hierarcyNames:[]
    }

    formRef = React.createRef();

    positions = {}

    componentDidMount() {
        console.log('this.props.edit',this.props.edit)
        this.setState({selectedPoints:[], cube:this.props.cube,loading:true, cubeAttributes:this.props.cube.entity.cubeAttributes},() => {
          this.setState({loading:false})
        })
        
    }

    handleSubmit() {
      console.log(this.state)
    }

    changePointStatus = (index) => {
        const { selectedPoints } = this.state;
        const updatedSelectedPoints = selectedPoints.includes(index)
          ? selectedPoints.filter(pointIndex => pointIndex !== index)
          : [...selectedPoints, index];
        this.setState({ selectedPoints: updatedSelectedPoints });
      };
    
    updateItems = (newItems) => {
      console.log(newItems)
      
      this.setState({ menuItems: newItems });
    };

    saveCube = () => {
      
      this.state.cube.entity['hierarchies']=this.state.menuItems
      if (this.props.edit==true){
        putCube(
              this.props.match.params.ontologyName,
              decodeURIComponent(this.props.match.params.ontologyVersion),
              this.state.cube,
              () => {
                  window.location.reload() 
              }
            )
      }
      else{
        postCube(
          this.props.match.params.ontologyName,
          decodeURIComponent(this.props.match.params.ontologyVersion),
          this.state.cube,
          () => {
            window.location.reload()
            
          }
        )
      }
      
      
      // console.log(this.state.cube,this.state.menuItems)

       
    }


    handleDelete = (itemIndex) => {
      
      console.log('index',itemIndex,'\nDelete item:', this.state.menuItems[itemIndex],'\n menu:',this.state.menuItems);
      const elementTBR = this.state.menuItems[itemIndex][1];

      const newMenuItems = this.state.menuItems.filter((_, index) => {
        return !index==itemIndex;
      });

      console.log('index',this.state.cubeAttributes.concat(elementTBR),'\nDelete item:', newMenuItems);
      const newCubeAttributes = this.state.cubeAttributes.concat(elementTBR)
      // // Implement your delete logic here
      // let new_menuItems = this.state.menuItems;
      // new_menuItems.splice(itemIndex,1);
      // console.log('nmI ',new_menuItems,this.state.menuItems);
      this.setState({loading:true,cubeAttributes:newCubeAttributes, menuItems:newMenuItems},() => {
        this.setState({loading:false})
      })

    };

    saveHierarchy = (values) => {
      let newHierarchy = [];
      for (let i = 0; i < this.state.selectedPoints.length; i++){
        const index = this.state.selectedPoints[i];
        newHierarchy.push(this.state.cubeAttributes[index]);
        
      }
      const newCubeAttributes = this.state.cubeAttributes.filter((_, index) => {
        return !this.state.selectedPoints.includes(index);
      });

      // store new hierarchy
      const valueTBA = [values.hierarchyName,newHierarchy];
      this.state.hierarchies.push(valueTBA);
      const appoggio = this.state.menuItems;
      // this.state.menuItems.push(valueTBA)
      appoggio.push(valueTBA);
      this.updateItems(appoggio);
      this.setState({selectedPoints:[]})
      
      // update attributes no used in hierarchies
      this.setState({loading:true,cubeAttributes:newCubeAttributes}, () =>{
        this.setState({loading:false})
      })
      // this.state.cubeAttributes = newCubeAttributes;
      this.formRef.current.resetFields(['hierarchyName']);
      
    }

    render () {
        
        let points=[];

        const container_size = 300; // Adjust this size as needed
        const circle_radius = container_size / 2 + 65; // Adjust the radius as needed


        const centerX = container_size / 2;
        const centerY = container_size / 2;
        let x = 0;
        if (this.state.loading==false){
          points=this.state.cubeAttributes;
        }

        

        return(
            <Layout>
                <Sider 
                    className='thirdMenu mastroEndpoint'
                    width="200"
                    style={{ padding: 4 }}
                >
                    <Menu 
                        style={{ backgroundColor: 'transparent' }}
                        theme='dark'
                        mode='inline'
                        onSelect={(item) => console.log(item)}
                    >
                        { this.state.loading == false?
                        this.state.menuItems.map((item, index) => {
                          console.log(`Item at index ${index} has key: ${item[0]}`);
                          return(
                          <div key={`menu-item-${index}`}>
                            <Popconfirm
                              title={
                                <>
                                  <div>Hierarchy attributes: {item[1].join(' → ')}</div>
                                  <div>Do you want to delete this Cube hierarchy?</div>
                                </>
                              }
                              onConfirm={() => this.handleDelete(index)}
                              okText="Yes"
                              cancelText="No">
                                <Menu.Item style={{ paddingLeft: '10' }} key={`popconfirm-${index}`}>
                                  {item[0]}
                                </Menu.Item>
                            </Popconfirm>
                          </div>
                        )}):null}
                    </Menu>
                </Sider>
                <Layout>
                    <Content>
                      <div style={{ height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div className='circumference-container' style={{ width: container_size, height: container_size }}>
                          {this.state.loading?
                            null:

                            this.state.cubeAttributes.map((point, index) => {
                              const angle = (index * 360) / points.length;
                              const top = centerY - Math.sin((angle * Math.PI) / 180) * circle_radius - 10;
                              const left = centerX + Math.cos((angle * Math.PI) / 180) * circle_radius;

                              const isHighlighted = this.state.selectedPoints.includes(index);
                              this.positions[index] = { top, left };

                              return (
                                <div key={index} className='point-container'>
                                  {isHighlighted ?
                                  <div
                                    className={"pointHighlited"}
                                    style={{ top: `${top}px`, left: `${left}px` }}
                                    onClick={() => this.changePointStatus(index)}
                                  >
                                    {this.state.selectedPoints.indexOf(index)}
                                    <div className="point-label" style={{ top: `${+20}px` }}>
                                      {point}
                                    </div>
                                  </div>:
                                  <div
                                  className={"point"}
                                  style={{ top: `${top}px`, left: `${left}px` }}
                                  onClick={() => this.changePointStatus(index)}
                                >
                                  <div className="point-label" style={{ top: `${+20}px` }}>
                                    {point}
                                  </div>
                                </div>}
                                </div>
                            );
                          })}

                        </div>
                      </div>
                    </Content>
                    <Footer className="footer-container-cube">
                      <Form 
                        className="form-container-cube"
                        onFinish={this.saveHierarchy}
                        ref={this.formRef}
                      >
                        <Form.Item 
                          name="hierarchyName"
                          rules={[
                              {
                                required: true,
                                message: 'Please enter hierarchy name',
                              },
                            ]}>
                          <Input
                            type="text"
                            placeholder="Insert hierarchy name"
                          />
                        </Form.Item>
                        <Form.Item>
                          <Button type="primary" htmlType="submit" disabled={this.state.selectedPoints.length < 2}>
                            Save Hierarchy
                          </Button>
                        </Form.Item>
                      </Form>
                      <Button key='saveCube' onClick={this.saveCube}>
                        Save Cube
                      </Button>
                      <Button key='back' onClick={this.props.toggleModal}>
                        Close
                      </Button>
                    </Footer>
                </Layout>
            </Layout>
        )
    }
}