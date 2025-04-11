import { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./services/queryClient";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import GlobalErrorBoundary from "./errorBoundaries/GlobalErrorBoundary";
import RouteErrorBoundary from "./errorBoundaries/RouteErrorBoundary";
import * as LazyComponents from "./lazyRoutes.jsx";
import { AuthProvider } from "./context/AuthProvider";
import { GoogleMapsProvider } from "./context/GoogleMapsContext";
import { ThemeLanguageProvider } from "./context/ThemeLanguageProvider";
import ProtectedRoutes from "./ProtectedRoutes";
import GlobalSpinner from "./components/global-spinner";
import RouteNameDisplay from "./RouteNameDisplay";

import {
  route_login,
  route_register,
  route_register_step,
  route_forgot_password,
  route_forgot_username,
  route_foreroom,
  route_create_post,
  route_edit_post,
  route_view_post,
  route_create_poll,
  route_view_poll,
  route_family_tree,
  route_family_member,
  route_chats,
  route_events,
  route_events_create_event,
  route_events_view_event,
  route_events_edit_event,
  route_kincoins,
  route_notifications,
  route_will,
  route_will_create_will,
  route_will_view_will,
  route_will_edit_will,
  route_profile,
  route_settings,
  route_kintree_member,
  route_tree_merge_request,
  route_create_recipe,
  route_edit_recipe,
  route_view_recipe,
  route_astrology,
  route_horoscope,
  route_zodiac_sign,
} from "./constants/routeEnpoints";
import PageNotFound from "./pages/PageNotFound";
import AuthLayout from "./layouts/AuthLayout";
import FlutterChat from "./pages/FlutterChat";
// import ViewTreeMergeRequest from "./pages/ViewTreeMergeRequest";
import { AnalyticsProvider } from "./context/AnalyticsProvider";
import ContentLayoutRightSideBar from "./layouts/ContentLayoutRightSideBar";
import ContentLayoutLeftSideBar from "./layouts/ContentLayoutLeftSideBar";
import Confetti from "./components/confetti";
// import Test from "./pages/Test";
import ScrollToTop from "./ScrollToTop";
import ViewRecipeComments from "./pages/ViewRecipeComments";

const {
  RootLayout,
  ContentLayout,
  Login,
  Register,
  RegisterStep,
  ForgotPassword,
  ForgotUsername,
  Foreroom,
  FamilyTree,
  FamilyMember,
  KintreeMember,
  CreatePost,
  EditPost,
  ViewPost,
  CreateRecipe,
  EditRecipe,
  ViewRecipe,
  CreatePoll,
  ViewPoll,
  Chats,
  Profile,
  Settings,
  NotificationsPage,
  Events,
  CreateEvent,
  EditEvent,
  ViewEvent,
  Kincoins,
  Will,
  CreateWill,
  EditWill,
  ViewWill,
  Astrology,
  Horoscope,
  ZodiacSign,
} = LazyComponents;

export default function App() {
  return (
    <RootLayout>
      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ScrollToTop />
            <AnalyticsProvider>
              <Suspense fallback={<GlobalSpinner />}>
                <Routes>
                  <Route
                    path="/flutter-chat/:token"
                    element={
                      <Suspense fallback={<GlobalSpinner />}>
                        <FlutterChat />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/*"
                    element={
                      <AuthProvider>
                        <Suspense fallback={<GlobalSpinner />}>
                          <RouteNameDisplay />
                          <Routes>
                            <Route errorElement={<RouteErrorBoundary />}>
                              <Route element={<AuthLayout />}>
                                <Route path={route_login} element={<Login />} />
                                <Route
                                  path={route_register}
                                  element={<Register />}
                                />
                                <Route
                                  path={route_forgot_password}
                                  element={<ForgotPassword />}
                                />
                                <Route
                                  path={route_forgot_username}
                                  element={<ForgotUsername />}
                                />
                              </Route>
                              <Route
                                path={`${route_register_step}/:step`}
                                element={<RegisterStep />}
                              />
                              <Route
                                path=""
                                element={
                                  <ProtectedRoutes>
                                    <GoogleMapsProvider>
                                      <ThemeLanguageProvider
                                        defaultTheme="light"
                                        defaultLanguage="en"
                                        storageKey="kintree-theme"
                                        languageStorageKey="kintree-language"
                                      >
                                        <Suspense fallback={<GlobalSpinner />}>
                                          <ContentLayout>
                                            <Outlet />
                                          </ContentLayout>
                                        </Suspense>
                                      </ThemeLanguageProvider>
                                    </GoogleMapsProvider>
                                  </ProtectedRoutes>
                                }
                              >
                                <Route
                                  path={route_foreroom}
                                  element={
                                    <ContentLayoutRightSideBar>
                                      <Outlet />
                                    </ContentLayoutRightSideBar>
                                  }
                                >
                                  <Route index element={<Foreroom />} />
                                  <Route
                                    path={route_create_post}
                                    element={<CreatePost />}
                                  />
                                  <Route
                                    path={route_create_poll}
                                    element={<CreatePoll />}
                                  />
                                  <Route
                                    path={route_view_post + "/:postId"}
                                    element={<ViewPost />}
                                  />
                                  <Route
                                    path={route_view_poll + "/:pollId"}
                                    element={<ViewPoll />}
                                  />
                                  <Route
                                    path={route_edit_post + "/:postId"}
                                    element={<EditPost />}
                                  />
                                  <Route
                                    path={route_create_recipe}
                                    element={<CreateRecipe />}
                                  />
                                  <Route
                                    path={route_edit_recipe + "/:recipeId"}
                                    element={<EditRecipe />}
                                  />
                                  <Route
                                    path={"recipe" + "/:recipeId"}
                                    element={<ViewRecipeComments />}
                                  />
                                </Route>
                                <Route
                                  path={route_family_tree}
                                  element={
                                    <ContentLayoutLeftSideBar>
                                      <Outlet />
                                    </ContentLayoutLeftSideBar>
                                  }
                                >
                                  <Route index element={<FamilyTree />} />
                                </Route>
                                <Route
                                  path={route_family_member}
                                  element={
                                    <ContentLayoutRightSideBar>
                                      <Outlet />
                                    </ContentLayoutRightSideBar>
                                  }
                                >
                                  <Route
                                    path={":id"}
                                    element={<FamilyMember />}
                                  />
                                </Route>
                                <Route
                                  path={route_kintree_member}
                                  element={
                                    <ContentLayoutRightSideBar>
                                      <Outlet />
                                    </ContentLayoutRightSideBar>
                                  }
                                >
                                  <Route
                                    path={":id"}
                                    element={<KintreeMember />}
                                  />
                                </Route>
                                {/* merge request */}
                                {/* <Route
                                  path={route_tree_merge_request}
                                  element={
                                    <ContentLayoutRightSideBar>
                                      <Outlet />
                                    </ContentLayoutRightSideBar>
                                  }
                                >
                                  <Route
                                    path={":requestId"}
                                    element={<ViewTreeMergeRequest />}
                                  />
                                </Route> */}
                                {/* chats */}
                                <Route
                                  path={route_chats + "/:token"}
                                  element={
                                    <ContentLayoutLeftSideBar>
                                      <Outlet />
                                    </ContentLayoutLeftSideBar>
                                  }
                                >
                                  <Route index element={<Chats />} />
                                </Route>
                                {/* notifications */}
                                <Route
                                  path={route_notifications}
                                  element={
                                    <ContentLayoutRightSideBar>
                                      <Outlet />
                                    </ContentLayoutRightSideBar>
                                  }
                                >
                                  <Route
                                    index
                                    element={<NotificationsPage />}
                                  />
                                </Route>
                                {/* events */}
                                <Route
                                  path={route_events}
                                  element={
                                    <ContentLayoutLeftSideBar>
                                      <Outlet />
                                    </ContentLayoutLeftSideBar>
                                  }
                                >
                                  <Route index element={<Events />} />
                                  <Route
                                    path={route_events_create_event}
                                    element={<CreateEvent />}
                                  />
                                  <Route
                                    path={route_events_view_event + "/:eventId"}
                                    element={<ViewEvent />}
                                  />
                                  <Route
                                    path={route_events_edit_event + "/:eventId"}
                                    element={<EditEvent />}
                                  />
                                </Route>
                                {/* kincoins */}
                                <Route
                                  path={route_kincoins}
                                  element={
                                    <ContentLayoutLeftSideBar>
                                      <Outlet />
                                    </ContentLayoutLeftSideBar>
                                  }
                                >
                                  <Route index element={<Kincoins />} />
                                </Route>
                                {/* astrology */}
                                <Route
                                  path={`${route_astrology}/*`}
                                  element={
                                    <ContentLayoutRightSideBar>
                                      <Outlet />
                                    </ContentLayoutRightSideBar>
                                  }
                                >
                                  <Route index element={<Astrology />} />
                                  <Route
                                    path={
                                      route_horoscope + "/:sunsign" + "/:id"
                                    }
                                    element={<Horoscope />}
                                  />
                                  <Route
                                    path={
                                      route_zodiac_sign + "/:sunsign" + "/:id"
                                    }
                                    element={<ZodiacSign />}
                                  />
                                </Route>
                                {/* will */}
                                <Route
                                  path={route_will}
                                  element={
                                    <ContentLayoutLeftSideBar>
                                      <Outlet />
                                    </ContentLayoutLeftSideBar>
                                  }
                                >
                                  <Route index element={<Will />} />
                                  <Route
                                    path={route_will_create_will}
                                    element={<CreateWill />}
                                  />
                                  <Route
                                    path={route_will_view_will}
                                    element={<ViewWill />}
                                  />
                                  <Route
                                    path={route_will_edit_will}
                                    element={<EditWill />}
                                  />
                                </Route>
                                {/* profile */}
                                <Route
                                  path={route_profile}
                                  element={
                                    <ContentLayoutLeftSideBar>
                                      <Outlet />
                                    </ContentLayoutLeftSideBar>
                                  }
                                >
                                  <Route index element={<Profile />} />
                                </Route>
                                {/* settings */}
                                <Route
                                  path={route_settings}
                                  element={
                                    <ContentLayoutLeftSideBar>
                                      <Outlet />
                                    </ContentLayoutLeftSideBar>
                                  }
                                >
                                  <Route index element={<Settings />} />
                                </Route>
                                {/* view recipe */}
                                <Route
                                  path={route_view_recipe}
                                  element={
                                    <ContentLayoutLeftSideBar>
                                      <Outlet />
                                    </ContentLayoutLeftSideBar>
                                  }
                                >
                                  <Route path=":id" element={<ViewRecipe />} />
                                </Route>
                              </Route>
                            </Route>
                            {/* <Route path="/test" element={<Test />} /> */}
                            <Route path="*" element={<PageNotFound />} />
                          </Routes>
                        </Suspense>
                      </AuthProvider>
                    }
                  />
                </Routes>
              </Suspense>
            </AnalyticsProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </GlobalErrorBoundary>
      <Confetti />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 1500,
        }}
      />
    </RootLayout>
  );
}
