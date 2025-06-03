import React from 'react';
import { Menu, Input, Button, Drawer, Layout, Spin } from 'antd'
import { PlusOutlined} from '@ant-design/icons'
import {getHierarchies, getVirtualEntities } from '../../../api/OntologyApi';
import MonolithEmpty from '../../components/MonolithEmpty';
import HierarchyPage from './HierarchyPage';
import HierarchyAdd from './HierarchyAdd';

const {
  Sider,
  Content,
} = Layout;

export default class HierarchyLayout extends React.Component {
    
    state = {
        visibleDrawer:false,
        menuItems:[],
        virtualEntities:[],
        loading:true,
        hierarchies:[],
        chosen_hierarchy:'',
    }

    // handle the click 
    handleMenuClick = (item) => {
        this.setState({ chosen_hierarchy: item });
    };

    handleSearchInputChange = (data) =>{
        const filteredMenuItems = Object.keys(this.state.hierarchies)
          .filter(item => item.toLowerCase().includes(data.target.value.toLowerCase()))
          .map(item => this.getMenuItem(item))
          .sort();
        this.setState({menuItems:filteredMenuItems});
    }

    getMenuItem = (item) => {
        const { selectedItem } = this.state;
        const isItemSelected = selectedItem === item;
    
        return (
          <Menu.Item
            key={item}
            className={isItemSelected ? 'highlighted-item' : ''}
            onClick={() => this.handleMenuClick(item)}
          >
            {item}
          </Menu.Item>
        );
    };

    getVE() {
        getVirtualEntities(
            this.props.match.params.ontologyName,
            decodeURIComponent(this.props.match.params.ontologyVersion),
            (data) => {
                for (let keys in data){
                    if(data[keys].entity.signature.length == 2){
                        this.state.virtualEntities.push(data[keys])
                    }
                }
            }
          );
    }

    getHier() {
        getHierarchies(
            this.props.match.params.ontologyName,
            decodeURIComponent(this.props.match.params.ontologyVersion),
            (data) => {
                this.setState({hierarchies:data},() => {
                    this.state.menuItems.push(Object.keys(data).map(item => this.getMenuItem(item)).sort());
                    this.setState({loading:false})
                })
            }
          );
    }

    componentDidMount() {
        this.getVE();
        this.getHier();
    }
    
    toggleDrawer = () => {
        this.setState({
            visibleDrawer:true,
            drawer: <HierarchyAdd
            {...this.props}
            VE={this.state.virtualEntities}
            close={() => this.setState({
              visibleDrawer: false
            })}
          />})
    }

    render() {
        const button = <Button
        style={{ backgroundColor: 'transparent', marginLeft: 4 }}
        onClick={this.toggleDrawer}
        icon={<PlusOutlined />}
        shape='circle' />




        return (
        this.state.loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 36 }}> <Spin size='large' /></div> :
            <Layout style={{ height: 'calc(100vh - 48px)', overflow: 'auto' }}>
                <Drawer title={'Add new Hierarchy'}
                    visible={this.state.visibleDrawer}
                    onClose={() => this.setState({ visibleDrawer: false })}
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
                    <Input allowClear onChange={this.handleSearchInputChange} placeholder='Search Hierarchy' />
                    {button}
                    </div>
                    
                    <Menu
                    style={{ backgroundColor: 'transparent' }}
                    theme='dark'
                    mode='inline'
                    >
                        {this.state.menuItems}
                    </Menu>
                </Sider>
                <Layout>
                    <Content>
                    <div style={{ padding: 8 }}>
                        {this.state.chosen_hierarchy?
                        <HierarchyPage
                            {...this.props}
                            hierarchy={this.state.hierarchies[this.state.chosen_hierarchy]}
                        />
                        : 
                        <MonolithEmpty message={'Create or select a Hierarchy'}>{button}</MonolithEmpty>}
                    </div>
                    </Content>
                </Layout>
            </Layout>
        )
  }
}