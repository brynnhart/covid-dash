import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { RTStackedChart } from "./RTStackedChart";
import { OffsetControls } from "./OffsetControls";
import Constants from "lib/Constants";
import { Util } from "lib/Util";
import { useRouter } from "next/router";
import { StatesWithIssues } from "config/USStates";
import { Col, Row } from "./Grid";
import { StateR0Display } from "./StateR0Display";

const refsByState = {};

export const RTHero = React.forwardRef(function (props, ref) {
  let rtData = props.rtData;
  let rtRef = props.rtRef;
  let isSmallScreen = props.width <= 768;
  let config = props.config;

  const [r0Data, setR0Data] = useState([]);
  const [dayOffset, setDayOffset] = useState(-1 - Constants.daysOffsetSinceEnd);
  const [filteredRegion, setFilteredRegion] = useState(null);
  const [filteredSubareas, setFilteredSubareas] = useState(null);
  const [highlightedSubareas, setHighlightedSubareas] = useState(
    _.keys(props.config.subAreas)
  );
  let detectedState = Util.getCookie("statecode");
  let currentFocused = highlightedSubareas;

  const regionOptions = props.config.regionFilterOptions;
  function StateFilterControls(props) {
    return (
      <div className="stacked-chart-state-controls">
        {_.map(regionOptions, (option) => {
          let isActive =
            filteredRegion === option ||
            (option === "All" && filteredRegion === null);
          let selectionRegion = option === "All" ? null : option;
          return (
            <Button
              key={option}
              active={isActive}
              onClick={() => {
                isActive
                  ? setFilteredRegion(null)
                  : setFilteredRegion(selectionRegion);
              }}
              shape="round"
            >
              {option}
            </Button>
          );
        })}
      </div>
    );
  }

  let lastUpdated = rtData.modelLastRunDate;
  const [clickedOnState, setClickedOnState] = useState(null);

  function decorateDataWithSortIndex(data) {
    _.each(data, (e, i) => {
      e["sort"] = i;
    });
    return data;
  }

  useEffect(() => {
    let filteredR0s = _.filter(rtData.dataSeries, (series, identifier) => {
      return !filteredSubareas || filteredSubareas.indexOf(identifier) !== -1;
    });
    let sortedR0s = _.sortBy(filteredR0s, (state) => {
      return _.nth(state.series, -1 - Constants.daysOffsetSinceEnd).r0;
    });
    setR0Data(sortedR0s);
  }, [rtData, filteredSubareas]);

  useEffect(() => {
    let subareasToFocus = filteredRegion
      ? props.config.getSubareasForFilter(filteredRegion, rtData.dataSeries)
      : _.keys(props.config.subAreas);
    if (props.isSmallScreen) {
      setFilteredSubareas(subareasToFocus);
      // TODO: setActiveFilteredStates(_.keys(props.config.subAreas));
    } else {
      setFilteredSubareas(null);
      setHighlightedSubareas(subareasToFocus);
    }
    currentFocused - subareasToFocus;
  }, [filteredRegion, rtData, props.isSmallScreen]);

  var colsPerChart;
  var spacerOffset = 4;
  var rowCount;
  if (props.width < 576) {
    colsPerChart = 24;
    rowCount = 1;
  } else if (props.width < 768) {
    colsPerChart = 12;
    rowCount = 2;
  } else if (props.width < 992) {
    colsPerChart = 11;
    spacerOffset = 2;
    rowCount = 2;
  } else if (props.width < 1200) {
    colsPerChart = 8;
    rowCount = 3;
  } else {
    colsPerChart = 6;
    rowCount = 4;
  }

  let router = useRouter();

  return (
    <div>
      <div className="stacked-chart-outer" ref={ref}>
        {props.isSmallScreen && <StateFilterControls />}
        {!props.isSmallScreen && (
          <OffsetControls
            highlightOptions={props.config.highlightOptions}
            filteredRegion={filteredRegion}
            lastUpdated={rtData.lastRTValueDate}
            setFilteredRegion={setFilteredRegion}
            setDayOffset={setDayOffset}
            dayOffset={dayOffset}
            isSmallScreen={props.isSmallScreen}
            label={props.config.subAreaType}
          />
        )}
        {props.isSmallScreen && (
          <>
            <RTStackedChart
              focusedStates={highlightedSubareas}
              offset={dayOffset}
              width={
                (rtRef.current &&
                  rtRef.current.getBoundingClientRect().width) ||
                props.width
              }
              height={480}
              config={props.config}
              onStateClicked={props.stateClickHandler}
              verticalMode={true}
              subAreas={props.config.subAreas}
              data={decorateDataWithSortIndex(r0Data)}
            />
            <OffsetControls
              highlightOptions={props.config.highlightOptions}
              filteredRegion={filteredRegion}
              setFilteredRegion={setFilteredRegion}
              setDayOffset={setDayOffset}
              lastUpdated={rtData.lastRTValueDate}
              dayOffset={dayOffset}
              label={props.config.subAreaType}
              isSmallScreen={props.isSmallScreen}
            />
          </>
        )}
        {!props.isSmallScreen && (
          <RTStackedChart
            focusedStates={highlightedSubareas}
            offset={dayOffset}
            width={
              (rtRef.current && rtRef.current.getBoundingClientRect().width) ||
              props.width
            }
            config={props.config}
            height={480}
            subAreas={props.config.subAreas}
            onStateClicked={props.stateClickHandler}
            verticalMode={false}
            data={decorateDataWithSortIndex(r0Data)}
          />
        )}
      </div>
      <Row className="stacked-states-outer">
        {rtData &&
          _.map(
            _.sortBy(
              _.keys(rtData.dataSeries),
              (state) => config.subAreas[state]
            ).filter((area) => currentFocused.includes(area)),
            (state, i) => {
              var align;
              switch (i % rowCount) {
                case 0:
                  align = "left";
                  break;
                case rowCount - 1:
                  align = "right";
                  break;
                default:
                  align = "center";
                  break;
              }
              refsByState[state] = refsByState[state] || React.createRef();
              return (
                <Col
                  key={state}
                  size={colsPerChart}
                  align={align}
                  offset={align === "center" ? spacerOffset : 0}
                >
                  <div className="stacked-state-wrapper">
                    <StateR0Display
                      ref={refsByState[state]}
                      config={config}
                      subArea={state}
                      runID={lastUpdated.getTime()}
                      hasDataIssue={StatesWithIssues[state]}
                      highlight={clickedOnState === state}
                      hasOwnRow={isSmallScreen}
                      data={rtData.dataSeries[state]}
                      contentWidth={props.width}
                    />
                  </div>
                </Col>
              );
            }
          )}
      </Row>
    </div>
  );
});

export default RTHero;
