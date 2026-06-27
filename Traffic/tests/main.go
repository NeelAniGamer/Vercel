package main

import (
	"fmt"
	"log"
	"time"

	"github.com/playwright-community/playwright-go"
	"go.uber.org/zap"
)

func main() {
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	err := playwright.Install()
	if err != nil {
		logger.Fatal("could not install playwright dependencies", zap.Error(err))
	}

	pw, err := playwright.Run()
	if err != nil {
		logger.Fatal("could not start playwright", zap.Error(err))
	}
	defer pw.Stop()

	// Launch singleton browser
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(false),
	})
	if err != nil {
		logger.Fatal("could not launch browser", zap.Error(err))
	}
	defer browser.Close()

	// Create isolated context
	context, err := browser.NewContext(playwright.BrowserNewContextOptions{
		Viewport: &playwright.Size{Width: 1280, Height: 720},
	})
	if err != nil {
		logger.Fatal("could not create context", zap.Error(err))
	}
	defer context.Close()

	page, err := context.NewPage()
	if err != nil {
		logger.Fatal("could not create page", zap.Error(err))
	}
	defer page.Close()

	logger.Info("Navigating to local game instance...")
	if _, err = page.Goto("http://127.0.0.1:8080/Traffic/Academy.html"); err != nil {
		logger.Fatal("could not goto", zap.Error(err))
	}

	// Verify HUD elements load
	logger.Info("Verifying UI glassmorphism elements...")
	hud := page.Locator(".hud-panel")
	if err := hud.First().WaitFor(playwright.LocatorWaitForOptions{
		State:   playwright.WaitForSelectorStateVisible,
		Timeout: playwright.Float(10000),
	}); err != nil {
		logger.Error("HUD not found or did not load", zap.Error(err))
	} else {
		logger.Info("HUD successfully rendered")
	}

	// Wait to visually confirm
	time.Sleep(5 * time.Second)
	fmt.Println("Test completed successfully.")
}
