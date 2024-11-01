import React, { useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import nerdamer from 'nerdamer/all';
import katex from 'katex';
import 'katex/dist/katex.min.css';

import isEmpty from '../lib/is_empty';

function ListItem({ expression, onChange, onDelete, onEnter }){
  const $input = React.useRef(null);

  useEffect(() => {
    $input.current.focus();
  }, []);

  const katexElement = useMemo(() => {
    try {
      return katex.renderToString(expression, { throwOnError: true, output: 'mathml', strict: true });
    } catch (err){
      return '<span className="katex-expression-error">Invalid Expression</span>';
    }
  }, [expression]);

  const handleExpression = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    if(e.key === 'Enter'){
      onEnter(e);
    }
  }, [onEnter]);

  return (
    <div className="expression">
      <div className="katex-expression" dangerouslySetInnerHTML={{ __html: katexElement }} />
      <div className="expression-input-container">
        <input ref={$input} className='expression-input' type="text" value={expression} onChange={handleExpression} onKeyDown={handleKeyDown} />
        <button className='expression-delete' onClick={onDelete}>X</button>
      </div>
    </div>
  );
}

ListItem.propTypes = {
  expression: PropTypes.string,
  onChange:   PropTypes.func.isRequired,
  onDelete:   PropTypes.func.isRequired,
  onEnter:    PropTypes.func.isRequired,
};

ListItem.defaultProps = {
  expression: '',
};

function getUUID(){
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getCombinations(expressions){
  const combinations = [];
  const uuids = Object.keys(expressions);

  for(let i = 0; i < uuids.length; i++){
    for(let j = i + 1; j < uuids.length; j++){
      combinations.push([uuids[i], uuids[j]]);
    }
  }

  return combinations;
}

function isValidExpression(expression){
  try {
    // Attempt to parse the expression with Nerdamer
    nerdamer(expression);
    return true; // The expression is valid
  } catch (error){
    return false; // The expression is invalid
  }
}

function getMissingVariables(expression){
  if (!isValidExpression(expression)){
    return [];
  }

  try {
    // Attempt to parse the expression with Nerdamer
    const missingVariables = nerdamer(expression.split('').join(' ')).variables().filter((variable) => !variable.includes('x') && !variable.includes('y'));
    return missingVariables;
  } catch (error){
    return [];
  }
}

export default function Expression(){
  const [expressions, setExpressions] = React.useState({ [getUUID()]: '' });
  const [isMoreThanTwoEquations, setIsMoreThanTwoEquations] = React.useState(false);
  const [resultSet, setResultSet] = React.useState({});
  const [invalidExpressions, setInvalidExpressions] = React.useState({});
  const [missingVariables, setMissingVariables] = React.useState({});
  const [missingVarsValues, setMissingVarsValues] = React.useState({});

  const deleteExpression = useCallback((id) => {
    const expObj = { ...expressions };
    delete expObj[id];
    setExpressions(expObj);

    if(Object.keys(expObj).length === 0){
      setExpressions({ [getUUID()]: '' });
    }

    setResultSet({});
    setInvalidExpressions((exps) => {
      const newExps = { ...exps };
      delete newExps[id];
      return newExps;
    });
    setMissingVariables((vars) => {
      const newVars = { ...vars };
      delete newVars[id];
      return newVars;
    });
  }, [expressions]);

  useEffect(() => {
    const solvableExpressions = {};

    Object.keys(expressions).forEach((key) => {
      if (expressions[key] && (expressions[key].includes('x') || expressions[key].includes('y'))){
        solvableExpressions[key] = expressions[key];
      }
    });

    const equations = Object.values(solvableExpressions);

    setIsMoreThanTwoEquations(equations.length > 2);

    if (equations.length >= 2){
      const combinations = getCombinations(solvableExpressions);
      const newResultSet = {};

      combinations.forEach((combination) => {
        try {
          const missingVars = Object.keys(missingVarsValues);
          const missingVarsRegex = new RegExp(missingVars.join('|'), 'g');

          let eq1 = solvableExpressions[combination[0]];
          let eq2 = solvableExpressions[combination[1]];

          if (!isEmpty(missingVars)){
            eq1 = eq1.replace(missingVarsRegex, (match) => missingVarsValues[match]);
            eq2 = eq2.replace(missingVarsRegex, (match) => missingVarsValues[match]);
          }

          eq1 = eq1.replace(/[a-wZ]/g, '');
          eq2 = eq2.replace(/[a-wZ]/g, '');

          const r = nerdamer.solveEquations([eq1, eq2]);

          newResultSet[combination.join(',')] = JSON.stringify(
            Object.fromEntries(r)
          ).replaceAll('":', ' = ').replaceAll('"', '');
        } catch(e){
          // Add proper error handling later
          console.log(e);
        }
      });

      setResultSet(newResultSet);
    }
  }, [expressions, invalidExpressions, missingVarsValues]);

  const handleExpression = useCallback((id, value) => {
    setExpressions({ ...expressions, [id]: value });
    setInvalidExpressions((exps) => ({ ...exps, [id]: !isValidExpression(value) }));

    const missingVarsForCurrentExpression = getMissingVariables(value);

    setMissingVariables((vars) => {
      const allMissingVarsExcludingCurrent = Object.values({ ...vars, [id]: [] }).flat(Infinity);

      return ({
        ...vars,
        [id]: missingVarsForCurrentExpression.filter(
          (varName) => !allMissingVarsExcludingCurrent.includes(varName)
        )
      });
    });
  }, [expressions]);

  const handleMissingVarsValues = useCallback((varName, value) => {
    setMissingVarsValues((values) => ({ ...values, [varName]: value }));
  }, []);

  const resetResults = useCallback(() => {
    setResultSet({});
    setExpressions({ [getUUID()]: '' });
    setInvalidExpressions({});
    setMissingVariables({});
    setMissingVarsValues({});
  }, []);

  return (
    <div className="expression-container">
      <div className="expression-list">
        {Object.keys(expressions).map((id, index) => (
          <div className="expression-item" key={id}>
            <span>Expression {index + 1}</span>

            <ListItem
              expression={expressions[id]}
              onChange={(value) => handleExpression(id, value)}
              onDelete={() => deleteExpression(id)}
              onEnter={() => setExpressions({ ...expressions, [getUUID()]: '' })}
            />

            {!isEmpty(missingVariables[id]) && (
              <div className="missing-variables">
                {missingVariables[id].map((varName) => (
                  <div key={`${id}-${varName}`}>
                    <label>{varName}</label>
                    <input className="missing-variables-input" type="number" value={missingVarsValues[varName]} defaultValue={1} onChange={(e) => handleMissingVarsValues(varName, e.target.value)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className='expression-add' onClick={() => setExpressions({ ...expressions, [getUUID()]: '' })}>Add Expression</button>
      <button className='expression-reset' onClick={resetResults} disabled={isEmpty(resultSet)}>Reset</button>

      {!isEmpty(resultSet) && (
        <div className="expression-results">
          <div className="result-set more-than-two-equations">
            {isMoreThanTwoEquations ? <p>More than two equations detected showing all possible solutions</p> : null}

            {Object.keys(resultSet).map((combination) => {
              const combIds = combination.split(',');

              return (
                <div key={combination}>
                  <p>{`${expressions[combIds[0]]} and ${expressions[combIds[1]]}`}</p>
                  <p>{resultSet[combination]}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
