import React from 'react';
import { EditFilled, DeleteFilled } from '@ant-design/icons';
import { Card, List, message, Tooltip, Popconfirm, Spin } from 'antd'
import { getCube, deleteCube,getDerivedCubes} from '../../../api/OntologyApi';

import ListCubeItem from '../../components/ListCubeItems'




export default class CubePage extends React.Component {
  
  state = {
    tables: [],
    loading: true,
    cube: null
  }

  componentDidMount() {
    this.getDataCube()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.chosen_cube !== this.props.chosen_cube) {
      this.getDataCube()
    }
  }

  getDataCube = () => {
    this.setState({ data: null, loading: true })
    getCube(
      this.props.match.params.ontologyName,
      decodeURIComponent(this.props.match.params.ontologyVersion),
      this.props.chosen_cube,
      this.loaded
    )

    
  }

  loaded = (data) => {
    this.setState({ cube: data, loading: false})
    getDerivedCubes(
      this.props.match.params.ontologyName,
      decodeURIComponent(this.props.match.params.ontologyVersion),
      (data) =>{
        this.setState({derivedCubes:data})
      }
    )
  }

  

  delete = () => {
      let derivedCubesFromCurrent = [];
    
      for (let i in this.state.derivedCubes){
        const derivedCube = this.state.derivedCubes[i];
        if (derivedCube.baseDataCube === this.state.cube.name ){
          derivedCubesFromCurrent.push(derivedCube.name)
        }
      }


      if (derivedCubesFromCurrent.length===0){
        deleteCube(
          this.props.match.params.ontologyName,
          decodeURIComponent(this.props.match.params.ontologyVersion),
          this.state.cube.name,
          () => {
            window.location.reload()
          }
        )
        
      }
      else{
        derivedCubesFromCurrent = derivedCubesFromCurrent.join(', ')
        message.error(<span>This cube cannot be deleted<br/>On this cube are built the cubes:<br/><b>{derivedCubesFromCurrent}</b></span>)
      }
      


    
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
        mapKey: "Cube Code",
        mapValue: data.cubeCode
      }
    ]
    for (let key in data.dimensions){
      const sign = {
            mapKey: "Dimension",
            mapValue: key+ ' over '+data.dimensions[key].veAttribute,
            veAttrib: data.dimensions[key].hierarchy!==undefined?'on hierarchy '+data.dimensions[key].hierarchy:'',
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

    if(data.countStar !== ''){
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
        actions={!this.props.cannotEdit && [
          <Tooltip title='Edit'>
            <div style={{ cursor: 'pointer' }} onClick={() => {
              this.props.edit(data)
            }}>
              <EditFilled />
            </div>
          </Tooltip>,
          <Popconfirm title={<span>Do you want to delete Cube?<br/>Check that it does not exists any derived Cubes from this Cube</span>} onConfirm={this.delete}>
            <div className='delete-icon' style={{ paddingLeft: 12 }}>
              <DeleteFilled />
            </div>
          </Popconfirm>
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
        </div>
      </div>
    )
  }
}

