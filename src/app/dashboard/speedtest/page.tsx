"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gauge, ArrowDown, ArrowUp, Wifi, RefreshCw } from "lucide-react";
import { Progress } from "../../../components/ui/progress";

const SpeedtestPage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "ping" | "download" | "upload" | "complete"
  >("idle");

  // Use local API routes for more accurate server-client speed testing
  const DOWNLOAD_API = "/api/speedtest/download";
  const UPLOAD_API = "/api/speedtest/upload";

  const startTest = async () => {
    setIsRunning(true);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setPing(null);
    setProgress(0);
    setStatus("ping");

    try {
      // 1. Ping Test
      const pingStart = performance.now();
      await fetch("/favicon.ico", { cache: "no-store" });
      const pingEnd = performance.now();
      setPing(Math.round(pingEnd - pingStart));
      setProgress(10);

      // 2. Download Test
      setStatus("download");
      const downloadStart = performance.now();

      // Perform parallel downloads to saturate bandwidth
      const downloadPromises = Array(4)
        .fill(0)
        .map(async () => {
          const response = await fetch(
            `${DOWNLOAD_API}?t=${new Date().getTime()}`,
            { cache: "no-store" }
          );
          const blob = await response.blob();
          return blob.size;
        });

      const downloadSizes = await Promise.all(downloadPromises);
      const totalDownloadSize = downloadSizes.reduce((a, b) => a + b, 0);
      const downloadEnd = performance.now();

      const downloadDurationInSeconds = (downloadEnd - downloadStart) / 1000;
      const downloadBits = totalDownloadSize * 8;
      const downloadSpeedMbps =
        downloadBits / downloadDurationInSeconds / 1000000;

      setDownloadSpeed(parseFloat(downloadSpeedMbps.toFixed(2)));
      setProgress(50);

      // 3. Upload Test
      setStatus("upload");
      // Create a 5MB dummy payload for each request
      const dummyData = new Uint8Array(5 * 1024 * 1024);
      const uploadStart = performance.now();

      // Perform parallel uploads
      const uploadPromises = Array(4)
        .fill(0)
        .map(() =>
          fetch(UPLOAD_API, {
            method: "POST",
            body: dummyData,
            cache: "no-store",
          })
        );

      await Promise.all(uploadPromises);

      const uploadEnd = performance.now();
      const uploadDurationInSeconds = (uploadEnd - uploadStart) / 1000;
      const totalUploadSize = dummyData.length * 4;
      const uploadSpeedMbps =
        (totalUploadSize * 8) / uploadDurationInSeconds / 1000000;

      setUploadSpeed(parseFloat(uploadSpeedMbps.toFixed(2)));
      setProgress(100);
      setStatus("complete");
    } catch (error) {
      console.error("Speedtest failed:", error);
      setStatus("idle");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <Gauge className="w-8 h-8 text-primary" />
          Internet Speed Test
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Check your internet connection speed and latency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Download Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
              DOWNLOAD
            </CardTitle>
            <ArrowDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {downloadSpeed !== null ? downloadSpeed : "--"}
              <span className="text-lg font-normal text-gray-500 ml-1">
                Mbps
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">
              UPLOAD
            </CardTitle>
            <ArrowUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {uploadSpeed !== null ? uploadSpeed : "--"}
              <span className="text-lg font-normal text-gray-500 ml-1">
                Mbps
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ping Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              PING
            </CardTitle>
            <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {ping !== null ? ping : "--"}
              <span className="text-lg font-normal text-gray-500 ml-1">ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white dark:bg-gray-800">
        <CardContent className="p-12 flex flex-col items-center justify-center space-y-8">
          {/* Status Indicator */}
          <div className="relative">
            {/* Animated Traffic Indicators */}
            {status === "download" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <ArrowDown
                    key={i}
                    className="absolute w-8 h-8 text-blue-500 opacity-60"
                    style={{
                      animation: `flowDown 1.5s ease-in-out infinite`,
                      animationDelay: `${i * 0.25}s`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                ))}
              </div>
            )}
            
            {status === "upload" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <ArrowUp
                    key={i}
                    className="absolute w-8 h-8 text-purple-500 opacity-60"
                    style={{
                      animation: `flowUp 1.5s ease-in-out infinite`,
                      animationDelay: `${i * 0.25}s`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                ))}
              </div>
            )}

            <div
              className={`w-48 h-48 rounded-full border-8 flex items-center justify-center transition-colors duration-500 relative z-10
              ${status === "idle" ? "border-gray-100 dark:border-gray-700" : ""}
              ${status === "ping" ? "border-green-500 animate-pulse" : ""}
              ${status === "download" ? "border-blue-500 animate-pulse" : ""}
              ${status === "upload" ? "border-purple-500 animate-pulse" : ""}
              ${status === "complete" ? "border-primary" : ""}
            `}
            >
              <div className="text-center">
                {status === "idle" && (
                  <Gauge className="w-16 h-16 text-gray-300 mx-auto" />
                )}
                {status === "ping" && (
                  <div className="flex flex-col items-center gap-2">
                    <Wifi className="w-12 h-12 text-green-500 animate-pulse" />
                    <div className="text-lg font-bold text-green-500">
                      Testing Ping...
                    </div>
                  </div>
                )}
                {status === "download" && (
                  <div className="flex flex-col items-center gap-2">
                    <ArrowDown className="w-12 h-12 text-blue-500 animate-bounce" />
                    <div className="text-lg font-bold text-blue-500">
                      Downloading...
                    </div>
                  </div>
                )}
                {status === "upload" && (
                  <div className="flex flex-col items-center gap-2">
                    <ArrowUp className="w-12 h-12 text-purple-500 animate-bounce" />
                    <div className="text-lg font-bold text-purple-500">
                      Uploading...
                    </div>
                  </div>
                )}
                {status === "complete" && (
                  <div className="text-2xl font-bold text-primary">Done!</div>
                )}
              </div>
            </div>

            <style jsx>{`
              @keyframes flowDown {
                0% {
                  top: -40px;
                  opacity: 0;
                }
                20% {
                  opacity: 0.6;
                }
                80% {
                  opacity: 0.6;
                }
                100% {
                  top: 220px;
                  opacity: 0;
                }
              }
              
              @keyframes flowUp {
                0% {
                  bottom: -40px;
                  opacity: 0;
                }
                20% {
                  opacity: 0.6;
                }
                80% {
                  opacity: 0.6;
                }
                100% {
                  bottom: 220px;
                  opacity: 0;
                }
              }
            `}</style>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="w-full max-w-md space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-gray-500 capitalize">
                {status} test in progress...
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button
            size="lg"
            onClick={startTest}
            disabled={isRunning}
            className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Testing...
              </>
            ) : (
              <>{status === "complete" ? "Test Again" : "Start Speed Test"}</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpeedtestPage;
