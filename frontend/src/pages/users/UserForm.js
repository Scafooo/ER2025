import React from 'react'
import {
  Form, Button, Col, Row, Input, Select, Drawer, Tag
} from 'antd';
import PasswordForm from './PasswordForm'
import { putUser, postUser, getRoles } from '../../api/UsersApi';
const CryptoJS = require("crypto-js");

export default class UserForm extends React.Component {
  formRef = React.createRef();

  state = {
    roles: []
  }

  componentDidMount() {
    this.setState({ loading: true })
    getRoles((roles) => this.setState({ roles, loading: false }))
    if (this.props.user) {
      this.formRef.current.setFieldsValue({
        name: this.props.user.name,
        firstName: this.props.user.firstName,
        lastName: this.props.user.lastName,
        email: this.props.user.email,
        roles: this.props.user.roles.map(i => i.name),
      })
    }
  }

  submit = (values) => {
    const user = {
      name: values.name,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      roles: this.state.roles.filter(i => values.roles.includes(i.name)),
    }
    if (this.props.user)
      putUser(user,
        (user) => {
          this.props.rerender(user)
        })
    else
      postUser(
        user,
        CryptoJS.MD5(values.password).toString(CryptoJS.enc.Hex).toUpperCase(),
        (user) => {
          this.props.rerender(user)
        })
  }

  columns = [
    {
      title: 'Domain',
      key: 'domain',
      dataIndex: 'domain'
    },
    {
      title: 'Action',
      key: 'action',
      dataIndex: 'action',
      render: tags => {
        if (!Array.isArray(tags)) {
          tags = [tags]
        }

        return <>
          {tags && tags.map(tag => {
            return (
              <Tag color={tag === 'GET' ? 'green' : tag === 'WRITE' ? 'volcano' : 'orange'} key={tag}>
                {tag}
              </Tag>
            );
          })}
        </>
      },
    },
    {
      title: 'Resource',
      key: 'resource',
      dataIndex: 'id'
    }
  ];

  render() {
    return (
      <div style={this.props.myUser ? { width: 500 } : {}}>
        <Drawer
          title='Change password'
          width={500}
          maskClosable={false}
          visible={this.state.visible}
          onClose={() => this.setState({ visible: false })}
          destroyOnClose>
          <PasswordForm {...this.props} close={() => this.setState({ visible: false })} />
        </Drawer>
        <Form layout="vertical" ref={this.formRef} onFinish={this.submit}>
          <Form.Item label="Username"
            name='name'
            rules={[
              { required: true, message: 'Please enter username' },
              { pattern: /^[A-Za-z][A-Za-z0-9_]*$/, message: 'You can use only letters numbers and underscore.' },
              {
                validator: (rule, value) => {
                  if (this.props.user) {
                    return Promise.resolve()
                  } else {
                    if (this.props.users.find(i => i.name === value)) {
                      return Promise.reject('Duplicated ID')
                    } else {
                      return Promise.resolve()
                    }
                  }
                }
              }
            ]}>
            <Input disabled={this.props.user} placeholder="Please enter username" autoComplete='none' />
          </Form.Item>
          {!this.props.user &&
            <Form.Item label="New Password"
              name='password'
              rules={[{ required: true, message: 'Please enter password' }]}>
              <Input.Password placeholder="Please enter password" autoComplete='new-password' />
            </Form.Item>
          }
          {!this.props.user &&
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Confirm Password"
                  name='confirm'
                  dependencies={['password']}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: 'Please confirm your password!',
                    },
                    ({ getFieldValue }) => ({
                      validator(rule, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject('The two passwords that you entered do not match!');
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Please enter password" autoComplete='new-password' />
                </Form.Item>
              </Col>
            </Row>
          }
          {this.props.myUser && <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Password">
                <Button onClick={() => this.setState({ visible: true })}>
                  Change password
                </Button>
              </Form.Item>
            </Col>
          </Row>}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Name" name='firstName'>
                <Input disabled={this.props.user && !this.props.myUser} placeholder="Please enter name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Surame" name='lastName'>
                <Input disabled={this.props.user && !this.props.myUser} placeholder="Please enter surname" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Email" name='email' rules={[{ type: 'email' }]}>
                <Input disabled={this.props.user && !this.props.myUser} placeholder="Please enter email" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Roles"
                name='roles'
                rules={[{ required: true, message: 'Please enter roles' }]}
              >
                <Select disabled={this.props.myUser} mode='multiple' placeholder='Please select roles' loading={this.state.loading}>
                  {this.state.roles.map(i => <Select.Option key={i.name} value={i.name}>
                    {/* <Tooltip
                      placement='left'
                      title={
                        <Table
                          size='small'
                          rowKey={(i) => `${i.domain}_${i.action}_${i.id}`}
                          rowClassName={() => 'editable-row'}
                          dataSource={i.permissions}
                          columns={this.columns}
                          pagination={false}
                        />
                      }> */}
                      {i.name}
                    {/* </Tooltip> */}
                  </Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            style={{ textAlign: 'center' }}>
            <Button onClick={this.props.rerender} style={{ marginRight: 8 }}>
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
