import React, { useContext, useState, useEffect } from "react";
import { DataFetchContext } from "lib/DataFetchContext";
import { useRouter } from "next/router";
import _ from "lodash";
import { ScrollToTopPill } from "./ScrollToTopPill";
import { RTFooter } from "./RTFooter";
import RTHeader from "./RTHeader";
import RTHero from "./RTHero";
import { Util } from "lib/Util";
import Constants from "lib/Constants";

const footerRef = React.createRef();
const rtRef = React.createRef();
const heroRef = React.createRef();

function stateClickHandler(router, stateCode) {
  let navigationQuery = Util.getNavigationQuery(document.location.search);
  router.push("/[countrycode]/[subarea]", {
    pathname: `/us/${stateCode}`,
    query: navigationQuery,
  });
}

export function RTOverview(props) {
  let isSmallScreen = props.width <= 768;
  let config = props.config;
  const [filteredSubareas, setFilteredSubareas] = useState(null);
  const [r0Data, setR0Data] = useState([]);

  // TODO move to Context
  let adminQuery = Util.getQueryParams(document.location.search)["admin"];
  if (adminQuery) {
    document.cookie = `admin=${adminQuery}`;
  }

  const rtData = useContext(DataFetchContext);

  useEffect(() => {
    console.log("FIRE!");
    let filteredR0s = _.filter(rtData.dataSeries, (series, identifier) => {
      return !filteredSubareas || filteredSubareas.indexOf(identifier) !== -1;
    });
    let sortedR0s = _.sortBy(filteredR0s, (state) => {
      return _.nth(state.series, -1 - Constants.daysOffsetSinceEnd).r0;
    });
    setR0Data(sortedR0s);
  }, [rtData, filteredSubareas]);

  let lastUpdated = rtData.modelLastRunDate;
  const [clickedOnState, setClickedOnState] = useState(null);

  if (!rtData || !props.width) {
    return null;
  }

  let isLgSize = props.width >= 991 && props.width < 1200;
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
  let detectedState = Util.getCookie("statecode");
  let router = useRouter();

  return (
    <>
      <RTHeader
        lastUpdated={lastUpdated}
        title={config.subAreaType}
        width={props.width}
        areaName={detectedState && config.subAreas[detectedState]}
        subArea={detectedState}
        useNewHeader={props.newHeader}
      />
      <div className="rt-container-wrapper">
        <div
          ref={rtRef}
          className={
            "rt-container " +
            (isSmallScreen ? "rt-container-small" : "rt-container-wide")
          }
        >
          <RTHero
            ref={heroRef}
            rtData={rtData}
            rtRef={rtRef}
            config={config}
            isSmallScreen={isSmallScreen}
            stateClickHandler={(stateCode) => {
              stateClickHandler(router, stateCode);
            }}
          />
        </div>
      </div>
      <RTFooter
        ref={footerRef}
        knownIssues={config.knownIssues}
        maxWidth={1500}
      />
      <ScrollToTopPill target={heroRef} />
    </>
  );
}
