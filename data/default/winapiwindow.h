#pragma once

#include <windows.h>
#include <GL/gl.h>

LRESULT CALLBACK WndProc(HWND, UINT, WPARAM, LPARAM);
bool active = true;

class CWindow {
public:
	CWindow() {
		hInstance = GetModuleHandle(NULL);
		wc.style = CS_OWNDC;
		wc.lpfnWndProc = (WNDPROC)WndProc;
		wc.cbClsExtra = 0;
		wc.cbWndExtra = 0;
		wc.hInstance = hInstance;
		wc.hIcon = LoadIcon(NULL, IDI_WINLOGO);
		wc.hCursor = LoadCursor(NULL, IDC_ARROW);
		wc.hbrBackground = NULL;
		wc.lpszMenuName = NULL;
	}

	~CWindow() {
		destroyWindow();
	}

	bool create(unsigned int width, unsigned int height, const char * title) {
		GLuint PixelFormat;
		DWORD dwExStyle;
		DWORD dwStyle;
		RECT WindowRect;
		WindowRect.left = (long) 0;
		WindowRect.right = (long) width;
		WindowRect.top = (long) 0;
		WindowRect.bottom = (long) height;
		wc.lpszClassName = title;

		if (!RegisterClass(&wc)) {
			return false;
		}

		dwExStyle = WS_EX_APPWINDOW | WS_EX_WINDOWEDGE;
		dwStyle = WS_OVERLAPPEDWINDOW;

		AdjustWindowRectEx(&WindowRect, dwStyle, false, dwExStyle);

		if (!(hWnd = CreateWindowEx(dwExStyle, wc.lpszClassName, title, dwStyle | WS_CLIPSIBLINGS | WS_CLIPCHILDREN, 0, 0, WindowRect.right - WindowRect.left, WindowRect.bottom - WindowRect.top, NULL, NULL, hInstance, NULL))) {
			destroyWindow();
			return false;
		}

		static  PIXELFORMATDESCRIPTOR pfd = {
				sizeof(PIXELFORMATDESCRIPTOR), 1, PFD_DRAW_TO_WINDOW | PFD_SUPPORT_OPENGL | PFD_DOUBLEBUFFER, PFD_TYPE_RGBA, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 8, 0, PFD_MAIN_PLANE, 0, 0, 0, 0
		};

		if (!(hDC = GetDC(hWnd))) {
			destroyWindow();
			return false;
		}

		if (!(PixelFormat = ChoosePixelFormat(hDC, &pfd))) {
			destroyWindow();
			return false;
		}

		if (!SetPixelFormat(hDC, PixelFormat, &pfd)) {
			destroyWindow();
			return false;
		}

		if (!(hRC = wglCreateContext(hDC))) {
			destroyWindow();
			return false;
		}

		if (!wglMakeCurrent(hDC, hRC)) {
			destroyWindow();
			return false;
		}

		ShowWindow(hWnd, SW_SHOW);
		SetForegroundWindow(hWnd);
		SetFocus(hWnd);
		glViewport(0, 0, width, height);

		glShadeModel(GL_SMOOTH);
		glClearColor(0.2f, 0.2f, 0.2f, 1.0f);
		glClearDepth(1.0f);
		glEnable(GL_DEPTH_TEST);

		return true;
	}

	void start(std::function<void()> onUpdate) {
		MSG msg;

		while (!shouldClose) {
			if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
				if (msg.message == WM_QUIT) {
					shouldClose = true;
				} else {
					TranslateMessage(&msg);
					DispatchMessage(&msg);
				}
			} else {
				if (active) {
					glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
					glClearColor(0.2f, 0.2f, 0.2f, 1.0f);
					SwapBuffers(hDC);
          onUpdate();
				}
			}
		}
	}

	void destroyWindow() {
		if (hRC) {
			wglMakeCurrent(NULL, NULL);
			wglDeleteContext(hRC);
			hRC = NULL;
		}

		if (hDC && !ReleaseDC(hWnd, hDC)) {
			hDC = NULL;
		}

		if (hWnd && !DestroyWindow(hWnd)) {
			hWnd = NULL;
		}

		if (!UnregisterClass(wc.lpszClassName, hInstance)) {
			hInstance = NULL;
		}
	}

	void close() {
		shouldClose = true;
	}

private:
	HDC hDC = NULL;
	HGLRC hRC = NULL;
	HWND hWnd = NULL;
	HINSTANCE hInstance;
	WNDCLASS wc;
	bool shouldClose = false;
};

LRESULT CALLBACK WndProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
	switch (uMsg) {
		case WM_ACTIVATE:
			active = !HIWORD(wParam);
			return 0;

		case WM_SYSCOMMAND:
			switch (wParam) {
				case SC_SCREENSAVE:
				case SC_MONITORPOWER:
					return 0;
			}

			break;

		case WM_CLOSE:
			PostQuitMessage(0);
			return 0;

		case WM_SIZE:
			glViewport(0, 0, LOWORD(lParam), HIWORD(lParam));
			return 0;
	}

	return DefWindowProc(hWnd, uMsg, wParam, lParam);
}

int main();

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
	return main();
}
