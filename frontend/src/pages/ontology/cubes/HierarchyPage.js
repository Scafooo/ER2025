import React from 'react';
import { EyeOutlined, DeleteFilled, EditOutlined } from '@ant-design/icons';
import { Card, List, Tooltip, Modal, Drawer, Popconfirm, Spin, message} from 'antd'
import { deleteHierarchy,deleteDerivedCube, getCubes} from '../../../api/OntologyApi';
import ListHierarchyItem from '../../components/ListHierarchyItems'
import HierarchyVisualization from './HierarchyVisualization';
import HierarchyEdit from './HierarchyEdit';





export default class HierarchyPage extends React.Component {
  
  state = {
    tables: [],
    loading: true,
    edges:[],
    modalOpen:false,
    visibleDrawer:false,
  }

  componentDidMount() {
    this.setHierarchy()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.hierarchy !== this.props.hierarchy) {
        this.setState({ data: null, loading: true, edges:[] },() => {this.setHierarchy()})
    }
  }

  setHierarchy = () => {
    
    this.setState({ data: this.props.hierarchy, loading:false})
    for (let key in this.props.hierarchy.signature){
      this.state.edges.push([this.props.hierarchy.signature[key]["input1"],this.props.hierarchy.signature[key]["input2"]])
    }
    this.setState({modalHierarchies:<HierarchyVisualization nodesHier={this.state.edges} />})
  }

  toggleModal = () => {
    this.setState({modalOpen:!this.state.modalOpen})
  }

  deleteDerived = (items) => {
    for(let i in items){
      const itemName = items[i];
      deleteDerivedCube(
        this.props.match.params.ontologyName,
        decodeURIComponent(this.props.match.params.ontologyVersion),
        itemName,
        () => {console.log(itemName)}
      )

    }
  }

  handleDeleteCubes = (cubes) => {
      cubes = cubes.join(', ')
      message.error(<span>This hierarchy cannot be deleted<br/>On this hierarchy are built the cubes:<br/><b>{cubes}</b></span>)
  }


  delete = () => {
    
    const cubes = []
    getCubes(
      this.props.match.params.ontologyName,
      decodeURIComponent(this.props.match.params.ontologyVersion),
      (data) => {
        for(let cubeName in data){
          const cube = data[cubeName]
          const dimensions = cube['dimensions']
          for(let i in dimensions){
            const dimension = dimensions[i];
            if(dimension['hierarchy'] === this.state.data.name){
              cubes.push(cubeName)
            }
          }
        }
        if(cubes.length>0){
          this.handleDeleteCubes(cubes)
        }
        else{
          deleteHierarchy(
            this.props.match.params.ontologyName,
            decodeURIComponent(this.props.match.params.ontologyVersion),
            this.state.data.name,
            (data) => {
              window.location.reload()
            }
          );
        }
        
      }
    )
    
    
    
  }

  closeDrawer = () => {
    this.setState({visibleEdit:false})
  }

  toggleEdit = () => {
    this.setState({
      visibleEdit:true,
        drawer: <HierarchyEdit
          {...this.props}
          hierarchy={this.props.hierarchy}
          close={this.closeDrawer}
        />
    })
}

  render() {
    
    const data = this.state.data
    
    if (data === null || this.state.loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 36 }}> <Spin size='large' /></div>


    const first = [
      {
        mapKey: "Description",
        mapValue: data.description
      },
      {
        mapKey: "Node list",
        mapValue: '['+data.nodes.sort().join(', ')+']'
      }
    ]
    for (const key in data.signature) {
      const sign = {
        mapKey: "Edge over "+data.signature[key]["select"],
        mapValue: data.signature[key]["input1"]+" → "+data.signature[key]["input2"],
      }
      first.push(sign)
    }

    const elements = [
      <Card
        size='small'
        className='mappingSQLCard'
        actions={[
          <Tooltip title='Visualize Hierarchy'>
            <div style={{ cursor: 'pointer' }} onClick={() => {
              this.setState({modalOpen:true})
            }}>
              <EyeOutlined />
            </div>
          </Tooltip>,
           <Tooltip title='Edit Hierarchy'>
           <div style={{ cursor: 'pointer' }} onClick={() => {
             this.setState(this.toggleEdit)
           }}>
             <EditOutlined />
           </div>
         </Tooltip>,
          <Popconfirm title={<span>Do you want to delete the hierarchy?<br/>This operation will delete all the cubes having the hierarchy</span>} onConfirm={this.delete}>
            <div className='delete-icon' style={{ paddingLeft: 12 }}>
              <DeleteFilled />
            </div>
          </Popconfirm>
        ]}>
        <ListHierarchyItem data={first} />
      </Card>,
    ]

    return (
      <div>
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
            </div>
        </div>
        <Modal
            title={"Hierarchy"}
            visible={this.state.modalOpen}
            onCancel={this.toggleModal}
            destroyOnClose
            footer={null}
            
            >
            {this.state.modalHierarchies}
        </Modal>
        <Drawer title={'Edit Hierarchy'}
                    visible={this.state.visibleEdit}
                    onClose={() => this.setState({ visibleEdit: false })}
                    destroyOnClose
                    keyboard={false}
                    width={'50vw'}>
                    {this.state.drawer} 
        </Drawer>
      </div>
    )
  }
}