// @flow
/* eslint-disable react/prop-types */
import expect from 'expect.js'
import React, {type StatelessFunctionalComponent} from 'react'
import TestRenderer from 'react-test-renderer'
import {stripIndent} from 'common-tags'
import {styled, SheetsRegistry, JssProvider, ThemeProvider} from '.'

const createGenerateId = () => {
  let counter = 0
  return rule => `${rule.key}-${counter++}`
}

describe('React-JSS: styled', () => {
  it('should render static styles', () => {
    const registry = new SheetsRegistry()
    const Div = styled('div')({color: 'red'})
    const renderer = TestRenderer.create(
      <JssProvider registry={registry} generateId={createGenerateId()}>
        <Div />
      </JssProvider>
    )
    expect(registry.toString()).to.be(stripIndent`
      .css-0 {
        color: red;
      }
    `)
    const {className, classes} = renderer.root.findByType('div').props
    expect(className).to.be('css-0')
    expect(classes).to.be(undefined)
  })

  it('should render dynamic styles', () => {
    const registry = new SheetsRegistry()
    const Div = styled('div')({
      color: 'red',
      width: () => 10
    })
    const renderer = TestRenderer.create(
      <JssProvider registry={registry} generateId={createGenerateId()}>
        <Div />
      </JssProvider>
    )
    expect(registry.toString()).to.be(stripIndent`
      .css-0 {
        color: red;
      }
      .css-0-1 {
        width: 10px;
      }
    `)
    expect(renderer.root.findByType('div').props.className).to.be('css-0 css-0-1')
  })

  it('should merge with user class name', () => {
    const registry = new SheetsRegistry()
    const Div = styled('div')({color: 'red'})
    const renderer = TestRenderer.create(
      <JssProvider registry={registry} generateId={createGenerateId()}>
        <Div className="my-class" />
      </JssProvider>
    )
    expect(registry.toString()).to.be(stripIndent`
      .css-0 {
        color: red;
      }
    `)
    expect(renderer.root.findByType('div').props.className).to.be('my-class css-0')
  })

  it('should use "as" prop', () => {
    const registry = new SheetsRegistry()
    const Div = styled('div')({color: 'red'})
    const renderer = TestRenderer.create(
      <JssProvider registry={registry} generateId={createGenerateId()}>
        <Div as="button">
          <span />
        </Div>
      </JssProvider>
    )
    expect(registry.toString()).to.be(stripIndent`
      .css-0 {
        color: red;
      }
    `)
    const {className, as} = renderer.root.findByType('button').props
    expect(className).to.be('css-0')
    expect(as).to.be(undefined)
  })

  it('should not leak non-dom attrs', () => {
    const registry = new SheetsRegistry()
    const Div = styled('div')({
      color: 'red',
      width: props => props.s
    })
    const renderer = TestRenderer.create(
      <JssProvider registry={registry} generateId={createGenerateId()}>
        <Div s={10} />
      </JssProvider>
    )
    expect(registry.toString()).to.be(stripIndent`
      .css-0 {
        color: red;
      }
      .css-0-1 {
        width: 10px;
      }
    `)
    const {className, s} = renderer.root.findByType('div').props
    expect(className).to.be('css-0 css-0-1')
    expect(s).to.be(undefined)
  })

  it('should compose with styled component', () => {
    const registry = new SheetsRegistry()
    const BaseDiv = styled('div')({color: 'red'})
    const Div = styled(BaseDiv)({width: 10})
    const renderer = TestRenderer.create(
      <JssProvider registry={registry} generateId={createGenerateId()}>
        <Div />
      </JssProvider>
    )
    expect(registry.toString()).to.be(stripIndent`
      .css-1 {
        color: red;
      }
      .css-0 {
        width: 10px;
      }
    `)
    const {className} = renderer.root.findByType('div').props
    expect(className).to.be('css-0 css-1')
  })

  it('should style any component', () => {
    const registry = new SheetsRegistry()
    type Props = Object
    let receivedCustomProp
    const BaseDiv: StatelessFunctionalComponent<Props> = ({className, customProp}: Props) => {
      receivedCustomProp = customProp
      return <div className={className} />
    }
    const Div = styled(BaseDiv)({width: 10})
    const renderer = TestRenderer.create(
      <JssProvider registry={registry} generateId={createGenerateId()}>
        <Div customProp />
      </JssProvider>
    )
    expect(registry.toString()).to.be(stripIndent`
      .css-0 {
        width: 10px;
      }
    `)
    const {className} = renderer.root.findByType('div').props
    expect(className).to.be('css-0')
    expect(receivedCustomProp).to.be(true)
  })

  it.skip('should target another styled component (not sure if we really need this)', () => {
    const registry = new SheetsRegistry()
    const Span = styled('span')({color: 'red'})
    const Div = styled('div')({
      // $FlowFixMe
      [Span]: {
        color: 'green'
      }
    })

    const renderer = TestRenderer.create(
      <JssProvider registry={registry} generateId={createGenerateId()}>
        <Div />
      </JssProvider>
    )
    expect(registry.toString()).to.be(stripIndent`
      .css-0 {
        width: 10px;
      }
    `)
    expect(renderer.root.findByType('div').props.className).to.be('XXX')
    expect(renderer.root.findByType('span').props.className).to.be('XXX')
  })

  it('should render theme', () => {
    const registry = new SheetsRegistry()
    const Div = styled('div')({
      color: 'red',
      margin: props => props.theme.spacing
    })
    TestRenderer.create(
      <JssProvider registry={registry} generateId={createGenerateId()}>
        <ThemeProvider theme={({spacing: 10}: Object)}>
          <Div />
        </ThemeProvider>
      </JssProvider>
    )
    expect(registry.toString()).to.be(stripIndent`
      .css-0 {
        color: red;
      }
      .css-0-1 {
        margin: 10px;
      }
    `)
  })
})
