import React from 'react';
import { Menu, Input, Layout, Spin, Drawer } from 'antd';
import { getCubes, getDerivedCubes } from '../../../api/OntologyApi';
import MonolithEmpty from '../../components/MonolithEmpty';
import CubePage from './CubeHandlePage';
import DerivedCubePage from './DerivedCubeHandlePage';

const { Sider, Content } = Layout;

export default class CubeHandleLayout extends React.Component {
  permissionsRef = React.createRef();
  state = {
    visibleEdit: false,
    loading: true,
    data: [],
    StoredCubes: [],
    chosen_cube: null,
    chosen_derivedCube: null,
    menuItems: [],
    derivedCubes: [], // Store derived cubes data
    derivedCubesName: [], // Store names of derived cubes
    selectedItem: null, // Keep track of the selected item
  };

  componentDidMount() {
    getDerivedCubes(
      this.props.match.params.ontologyName,
      decodeURIComponent(this.props.match.params.ontologyVersion),
      this.loadedDC
    );
  }

  addDerivedCube = (value) => {
    console.log(this.state.derivedCubesName, value);
    // Ensure the value is not already in the list of derived cubes
    if (!this.state.derivedCubesName.includes(value)) {
      // Update the derived cubes data and names
      const newDerivedCubes = { ...this.state.derivedCubes };
      newDerivedCubes[value] = {}; // You can adjust the structure as needed
  
      // Create the new menu item for the derived cube
      const newMenuItem = this.getChildren(value);
  
      // Find the "Derived Cubes" parent menu item and add the new item as its child
      const updatedMenuItems = this.state.menuItems.map((item) => {
        if (item.key === 'derivedCubes') {
          return {
            ...item,
            children: [...(item.children || []), newMenuItem],
          };
        }
        return item;
      });
  
      this.setState((prevState) => ({
        derivedCubes: newDerivedCubes,
        derivedCubesName: [...prevState.derivedCubesName, value],
        menuItems: updatedMenuItems,
      }), () => {
        console.log(this.state.derivedCubesName, value);
      });
    }
  };
  
  loadedDC = (data) => {
    this.setState(
      { derivedCubes: data, derivedCubesName: Object.keys(data) },
      () => {
        getCubes(
          this.props.match.params.ontologyName,
          decodeURIComponent(this.props.match.params.ontologyVersion),
          this.loaded2
        );
      }
    );
  };

  loaded2 = (cubes) => {
    const cubes_keys = Object.keys(cubes).sort();
    const menuItems = cubes_keys.map(item => this.getMenuItem(item)).sort();
    let menuItemsDerived = {
      key:'derivedCubes',
      label:'Derived Cubes',
      children:this.state.derivedCubesName.map(item => this.getChildren(item))
    }
    this.setState({
      StoredCubes: cubes_keys,
      loading: false,
      menuItems: menuItems.concat(menuItemsDerived), // Update the menuItems in the state
      totalMenuItems: menuItems.concat(menuItemsDerived), // Update the menuItems in the state
    });
  };

  getChildren = (item) => {
    return(
      {
        key:'derived__'+item,
        label:item
      }
    )
  }


  toggleEdit = (data) => {
    console.log(data);
    this.setState({
      visibleEdit: true,
    });
  };

  getMenuItem = (item) => {
    return (
      {
        key:item,
        label:item
      }
    );
  };


  handleSearchInputChange = (data) => {
    console.log(this.state.menuItems)
    const filteredMenuItems = this.state.totalMenuItems
      .filter(item => item['key'].toLowerCase().includes(data.target.value.toLowerCase()))
      .sort();
    console.log(filteredMenuItems)
    this.setState({ menuItems: filteredMenuItems });
  };

  clickbutton = (item) => {
    const regex = /^derived__/;

    if (regex.test(item)) {
      this.setState({ chosen_derivedCube: item.split('__')[1], chosen_cube: null });
    } else {
      this.setState({ chosen_cube: item, chosen_derivedCube: null });
    }
  }

  render() {
    return (
      this.state.loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 36 }}>
          <Spin size='large' />
        </div>
      ) : (
        <Layout style={{ height: 'calc(100vh - 48px)', overflow: 'auto' }}>
          <Drawer
            maskClosable={false}
            title={'Edit SQL View'}
            visible={this.state.visibleEdit}
            onClose={() => this.setState({ visibleEdit: false })}
            destroyOnClose
            keyboard={false}
            width={'50vw'}
          >
            {this.state.drawer}
          </Drawer>
          <Sider
            className='thirdMenu mastroEndpoint'
            collapsed={this.state.collapsed}
            width="200"
            style={{ padding: 4 }}
          >
            <div style={{ display: 'flex' }}>
              <Input
                allowClear
                onChange={this.handleSearchInputChange}
                placeholder='Search Cube'
              />
            </div>
            <Menu
              style={{ backgroundColor: 'transparent' }}
              theme='dark'
              mode='inline'
              onClick={({ key }) => this.clickbutton(key)}
              items={this.state.menuItems}
            />
              {/* {this.state.menuItems}
              {this.getDerivedCubesMenu()} {/* Add the Derived Cube submenu */}
            {/* </Menu> */}
          </Sider>
          <Layout>
            <Content>
              <div style={{ padding: 8 }}>
                {this.state.chosen_cube ? (
                  <CubePage
                    {...this.props}
                    edit={this.toggleEdit}
                    chosen_cube={this.state.chosen_cube}
                    addDerivedCube={this.addDerivedCube}
                    show_tbl={false}
                  />
                ) : (
                  this.state.chosen_derivedCube ? (
                      <DerivedCubePage
                      {...this.props}
                      addDerivedCube={this.addDerivedCube}
                      cube={this.state.chosen_derivedCube}
                    />
                  ) : (
                    <MonolithEmpty message={'Choose a Cube'} />
                  )
                )}
              </div>
            </Content>
          </Layout>
        </Layout>
      )
    );
  }
}

