#pragma once

#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <GL/gl.h>
#include <GL/glx.h>
#include <cstring>
#include <functional>

typedef GLXContext (*glXCreateContextAttribsARBProc)(Display *, GLXFBConfig, GLXContext, Bool, const int *);
typedef Bool (*glXMakeContextCurrentARBProc)(Display *, GLXDrawable, GLXDrawable, GLXContext);

class CWindow {
public:
	CWindow() {
		display = XOpenDisplay(nullptr);

		if (display == nullptr) {
			return;
		}

		DefaultScreenOfDisplay(display);
		screenId = DefaultScreen(display);

		GLint majorGLX, minorGLX = 0;
		glXQueryVersion(display, &majorGLX, &minorGLX);

		if (majorGLX <= 1 && minorGLX < 2) {
			XCloseDisplay(display);
			return;
		}

		static int glxAttribs[] = {
			GLX_X_RENDERABLE, True,
			GLX_DRAWABLE_TYPE, GLX_WINDOW_BIT,
			GLX_RENDER_TYPE, GLX_RGBA_BIT,
			GLX_X_VISUAL_TYPE, GLX_TRUE_COLOR,
			GLX_RED_SIZE, 8,
			GLX_GREEN_SIZE, 8,
			GLX_BLUE_SIZE, 8,
			GLX_ALPHA_SIZE, 8,
			GLX_DEPTH_SIZE, 24,
			GLX_STENCIL_SIZE, 8,
			GLX_DOUBLEBUFFER, True,
			None
		};

		int fbcount;
		GLXFBConfig * fbc = glXChooseFBConfig(display, screenId, glxAttribs, &fbcount);

		if (!fbc) {
			XCloseDisplay(display);
			return;
		}

		int best_fbc = -1, worst_fbc = -1, best_num_samp = -1, worst_num_samp = 999;

		for (int i = 0; i < fbcount; ++i) {
			XVisualInfo *vi = glXGetVisualFromFBConfig( display, fbc[i] );

			if (vi) {
				int samp_buf, samples;
				glXGetFBConfigAttrib(display, fbc[i], GLX_SAMPLE_BUFFERS, &samp_buf);
				glXGetFBConfigAttrib(display, fbc[i], GLX_SAMPLES, &samples);

				if (best_fbc < 0 || (samp_buf && samples > best_num_samp)) {
					best_fbc = i;
					best_num_samp = samples;
				}

				if (worst_fbc < 0 || !samp_buf || samples < worst_num_samp) {
					worst_fbc = i;
				}

				worst_num_samp = samples;
			}

			XFree( vi );
		}

		bestFbc = fbc[best_fbc];
		XFree(fbc);

		visual = glXGetVisualFromFBConfig(display, bestFbc);

		if (!visual) {
			XCloseDisplay(display);
			return;
		}

		if (screenId != visual->screen) {
			XCloseDisplay(display);
			return;
		}
	}

	~CWindow() {
		destroyWindow();
		XCloseDisplay(display);
	}

	bool create(unsigned int width, unsigned int height, const char * title) {
		destroyWindow();

		windowAttribs.border_pixel = BlackPixel(display, screenId);
		windowAttribs.background_pixel = WhitePixel(display, screenId);
		windowAttribs.override_redirect = True;
		windowAttribs.colormap = XCreateColormap(display, RootWindow(display, screenId), visual->visual, AllocNone);
		windowAttribs.event_mask = ExposureMask;
		window = XCreateWindow(display, RootWindow(display, screenId), 0, 0, width, height, 0, visual->depth, InputOutput, visual->visual, CWBackPixel | CWColormap | CWBorderPixel | CWEventMask, &windowAttribs);
		XStoreName(display, window, title);

		atomWmDeleteWindow = XInternAtom(display, "WM_DELETE_WINDOW", False);
		XSetWMProtocols(display, window, &atomWmDeleteWindow, 1);

		glXCreateContextAttribsARBProc glXCreateContextAttribsARB = nullptr;
		glXCreateContextAttribsARB = (glXCreateContextAttribsARBProc) glXGetProcAddressARB((const GLubyte *) "glXCreateContextAttribsARB");

		int context_attribs[] = {
			GLX_CONTEXT_MAJOR_VERSION_ARB, 3,
			GLX_CONTEXT_MINOR_VERSION_ARB, 2,
			GLX_CONTEXT_FLAGS_ARB, GLX_CONTEXT_FORWARD_COMPATIBLE_BIT_ARB,
			None
		};

		const char * glxExts = glXQueryExtensionsString( display,  screenId );

		if (!strstr(glxExts, "GLX_ARB_create_context")) {
			context = glXCreateNewContext( display, bestFbc, GLX_RGBA_TYPE, nullptr, True );
		} else {
			context = glXCreateContextAttribsARB( display, bestFbc, nullptr, true, context_attribs );
		}

		XSync( display, False );

		glXMakeCurrent(display, window, context);

		glClearColor(0.2f, 0.2f, 0.2f, 1.0f);
		glViewport(0, 0, 640, 480);

		return true;
	}

	void start(std::function<void()> onUpdate) {
		XClearWindow(display, window);
		XMapRaised(display, window);
		XEvent ev;

		while (!shouldClose) {
			if (XPending(display) > 0) {
				XNextEvent(display, &ev);

				if (ev.type == Expose) {
					XWindowAttributes attribs;
					XGetWindowAttributes(display, window, &attribs);
					glViewport(0, 0, attribs.width, attribs.height);
				}

				if (ev.type == ClientMessage) {
					if (ev.xclient.data.l[0] == atomWmDeleteWindow) {
						break;
					}
				} else if (ev.type == DestroyNotify) {
					break;
				}
			}

			onUpdate();

			glClear(GL_COLOR_BUFFER_BIT);
			glXSwapBuffers(display, window);
		}
	}

	void destroyWindow() {
		if (window != NULL) {
			glXDestroyContext(display, context);
			XFree(visual);
			XFreeColormap(display, windowAttribs.colormap);
			XDestroyWindow(display, window);
			window = NULL;
		}
	}

	void close() {
		shouldClose = true;
	}

private:
	Display * display = nullptr;
	int screenId = 0;
	Window window = NULL;
	GLXContext context;
	XVisualInfo * visual;
	GLXFBConfig bestFbc;
	Atom atomWmDeleteWindow;
	XSetWindowAttributes windowAttribs;
	bool shouldClose = false;
};
