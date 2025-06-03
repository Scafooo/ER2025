import React from 'react';
import { Table } from 'antd';
import MonolithEmpty from './MonolithEmpty';

export default class ListCubeItem extends React.Component {
  
  
  render() {
    if (this.props.data === undefined) return null
    if (this.props.data.length === 0) return <MonolithEmpty />

    let columns = []
    if (this.props.data[0].mapKey) {
      columns.push({ dataIndex: 'mapKey', width: 120, ellipsis: true })
    }
    columns.push({ 
      dataIndex: 'mapValue',
      render: (text) => {
        if (text != undefined){
          const lines = text.split('\n');
          if (lines.length==1){
            const words = text.split(' ');

            // Initialize variables to track consecutive words
            let consecutiveCount = 0;
            let renderedText = [];
            
            // Map over the words and apply styles as needed
            words.forEach((word, index) => {
              if (word === 'with' && words[index + 1] === 'operation' ) {
                consecutiveCount += 1;
                renderedText.push(
                  <span
                    key={index}
                    style={{ color: '#8894a3'}}
                  >
                    {word} {words[index + 1]+' '}
                  </span>
                );
              }
              else if(word === 'over') {
                renderedText.push(
                    <span
                      key={index}
                      style={{ color: '#8894a3'}}
                    >
                      {word+' '}
                    </span>
                );
              }
              else {
                if (consecutiveCount === 0) {
                  renderedText.push(
                    <span key={index} style={{ fontWeight: 'bold' }}>
                      {word+' '}
                    </span>
                  );
                }
                else {
                  consecutiveCount -= 1;
                }
              }
            });
            
            return (
              <span style={{ color: 'white' }}>
                {renderedText}
              </span>
            );
          }
          else{
            return (
              <div style={{ color: 'white' }}>
                {lines.map((line, index) => (
                  <div key={index}>
                    {highlightWords(line)}
                  </div>
                ))}
              </div>
            );
          }
        }
        else{
          return (
            <span style={{ color: 'white' }}>
              {text}
            </span>
          );
        }
      },
      ellipsis: true
    })
    
    columns.push({ 
      dataIndex: 'veAttrib',
      render: (text, record) => {
        if (text != undefined){
        // Split the text into words
          const words = text.split(' ');
      
          // Map over the words and apply styles as needed
          const renderedText = words.map((word, index) => {
            if (word === 'on' || word === 'dimension' || word === 'over' || word === 'hierarchy') {
              return <span key={index} style={{ color: '#8894a3' }}>{word+ ' '}</span>;
            } else {
              return <span key={index} style={{fontWeight: 'bold'}}>{word + ' '}</span>;
            }
          });
      
          return (
            <span style={{ color: 'white' }}>
              {renderedText}
            </span>
          );
        }
        else{
          return (
            <span style={{ color: 'white' }}>
              {text}
            </span>
          );
        }
      },
      width: 250,
      ellipsis: true
   });

   function highlightWords(line) {
      const words = line.split(' ');

      return words.map((word, index) => {
        if (word === 'with' || word === 'on' || word === 'as' || word === 'hierarchy' || word === 'measure' || word === 'dimension' || word === 'from') {
          return (
            <span key={index} style={{ color: '#8894a3' }}>
              {word + ' '}
            </span>
          );
        } else {
          return (
            <span  key={index}>
              {word + ' '}
            </span>
          );
        }
      });
    }

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

