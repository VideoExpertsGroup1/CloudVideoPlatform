#!/bin/bash

INK=/usr/bin/inkscape

RESFOLDER="../app/src/main/res/"

function makePng {
	SVG=$1
	BASE=`basename $1 .svg`
	echo $1
	echo $BASE
	OUT=$RESFOLDER"drawable-hdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 48 -h 48
	OUT=$RESFOLDER"drawable-mdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 32 -h 32
	OUT=$RESFOLDER"drawable-xhdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 64 -h 64
	OUT=$RESFOLDER"drawable-xxhdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 96 -h 96
	OUT=$RESFOLDER"drawable-xxxhdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 128 -h 128
	
}

function makePng2 {
	SVG=$1
	BASE=`basename $1 .svg`
	echo $1
	echo $BASE
	OUT=$RESFOLDER"drawable-hdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 342 -h 48
	OUT=$RESFOLDER"drawable-mdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 228 -h 32
	OUT=$RESFOLDER"drawable-xhdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 456 -h 64
	OUT=$RESFOLDER"drawable-xxhdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 686 -h 96
	OUT=$RESFOLDER"drawable-xxxhdpi/"$BASE".png"
	$INK -z -D --export-area-page -e $OUT  -f $SVG -w 914 -h 128
	
}

makePng "gplusicon.svg"

makePng2 "btn_google_signin.svg"


