import React from 'react';
import { Table } from 'antd';
import MonolithEmpty from './MonolithEmpty';

export default class ListDerivedCubeItems extends React.Component {
  render() {
    if (this.props.data === undefined) return null
    if (this.props.data.length === 0) return <MonolithEmpty />

    let columns = []
    if (this.props.data[0].mapKey) {
      columns.push({ dataIndex: 'mapKey', width: 170, ellipsis: true })
    }
    columns.push({
        dataIndex: 'mapValue',
        render: text => (
          <div style={{ whiteSpace: 'pre-line' }}>
            {text.split('\n').map((line, lineIndex) => (
              <div key={lineIndex}>
                {line.split(' ').map((word, wordIndex) => {
                  let style = {};
                  if (['Roll-up', 'Drill-down'].includes(word)) {
                    style.color = 'orange';
                  } else if (['on', 'at', 'node', 'of', 'hierarchy', 'with', 'operation', 'having'].includes(word)) {
                    style.color = 'grey';
                  } else {
                    style.fontWeight = 'bold';
                  }
                  return (
                    <span key={wordIndex} style={style}>
                      {word}{' '}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        ),
        ellipsis: true,
      });

    let data = this.props.data
    for (let i = 0; i < data.length; i++) {
      data[i].key = i
    }

    return (
      <Table
        columns={columns}
        showHeader={false}
        pagination={false}
        dataSource={data}
        rowClassName={record => record.warning ? 'warningRow' : ''}
      />
    );
  }
}