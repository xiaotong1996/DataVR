#!/bin/bash
if [[ $# -ne 1 || ! -f $1 ]]; then
    echo "Usage: $0 <file.txt> > <file.geojson>"
    exit 1
fi
(
    echo 'geonameid name asciiname alternatenames latitude longitude featureClass featureCode countryCode cc2 admin1Code admin2Code admin3Code admin4Code population elevation dem timezone modificationDate' | sed 's/ /\t/g'
    cat $1
) | csvjson --lat latitude --lon longitude --tabs