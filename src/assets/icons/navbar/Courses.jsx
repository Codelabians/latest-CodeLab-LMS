import React from "react";

function Courses(props) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* <mask
        id="mask0_219_441"
        style="mask-type:alpha"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="44"
        height="44"
      >
        <rect width="44" height="44" fill="url(#pattern0_219_441)" />
      </mask> */}
      {/* <g mask="url(#mask0_219_441)">
        <rect width="44" height="44" fill="white" />
      </g>
      <defs>
        <pattern
          id="pattern0_219_441"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlink:href="#image0_219_441" transform="scale(0.005)" />
        </pattern>
        <image
          id="image0_219_441"
          width="200"
          height="200"
          xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAADUhJREFUeJzt3XmQHGUZx/FvssmSwJKDwxAFIiQhCggmFUSJHCJ4JooCBYFCQQ5Bbg/QErDQEhWFwgMBRURAoggiJiDIEUTQitxHICZgEhKOJNy7CYQc6x/PLBs23e/09HT3+07371P1VMFke+bpmX5mut/37fcFERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERGRkuuXcrtBwCigo4nnkNaxBngFeLr23xJhY+BUYBawGuhWVC5WADcDU4E25C2HAy/g/wNShBNPAJOouDbg1/j/MBRhxmrgOCpMxaFIEkdRQYfj/41XtEasBHamhOJaoDYG5gObFpiLtLa7gd19J5G1/jGPH4WKQxrzYWA330lkLa5ADi40CymL0h03UadYg4Au1M4tjXsIGO87iSxF/YKMQsUh6Yz2nUDWBkQ81tHkc64G/oFd5G8O7I1d9NfTBdwOLAPGYBd8SQp1CTAT6+UdT8m+wVpMs8dOS5hI+ua+Waz/LTIE+E2d7aYBw/tstx1wr2ObtcB3gPY+230EeKaJfVA0F6WXtkDmYcUQ55qY7aYT39w8pPa8Udud7Xit9wDLU+6HQgXilLZAptZ53m1jthtbZ7upEdssBTaos915KfdDoQJxSlsgwxI894I+2zyZYJvhEa/1hwTb7ZtyPxQqkLfE9YOksTzB36xIsU3U36TdTqQhWRZIvbE4Q1j/An4M9U+VJkQ8tkOCfKK2E2la2lOsq+s877djtvtyne3+FLPdRMc27cCclPuh0CmWUzPNvN+Iec4p2IjPqG06ib/x5puO13oS2Dpim3asWH0fKFWNUolqXp2I9T+kNRPr93gSGAkcVAvXveurgcuBG7COwrHAkcBedV7rVeCXwB30dhSegDXzih+lmqMgjwKRaitVgWR5kS5SOioQEQcViIiDCkTEQQUi4qACEXFQgYg4qEBEHFQgIg5R96SntQybHl/KYRSwme8kQpR2sOLFPpKV3FyKBivqFEvERQUi4qACEXFQgYg4qEBEHFQgIg4qEBEHFYiIgwpExEEFIuKgAhFxUIGIOIRcIEOxVVNH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"
        />
      </defs> */}
    </svg>
  );
}

export default Courses;
