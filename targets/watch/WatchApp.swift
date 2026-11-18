import SwiftUI

@main
struct EvccWatchApp: App {
  @StateObject private var servers = ServerList()

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(servers)
    }
  }
}

struct ContentView: View {
  @EnvironmentObject private var servers: ServerList
  @StateObject private var model = SiteModel()
  @Environment(\.scenePhase) private var scenePhase
  @State private var showServers = false
  @State private var page = Self.overviewPage

  // Loadpoint pages are tagged with their API index.
  private static let overviewPage = -1

  private var pollKey: String {
    "\(servers.selected?.id ?? "")|\(servers.selected?.url ?? "")|\(scenePhase == .active)"
  }

  var body: some View {
    NavigationStack {
      if let server = servers.selected {
        pages(server)
          .navigationTitle(server.displayTitle)
          .toolbar {
            if servers.servers.count > 1 {
              ToolbarItem(placement: .topBarLeading) {
                Button {
                  showServers = true
                } label: {
                  Image(systemName: "server.rack")
                }
                .accessibilityLabel(L.t("widget.config.server"))
              }
            }
          }
          .sheet(isPresented: $showServers) {
            ServerPicker(selectedId: $servers.selectedId, servers: servers.servers)
          }
      } else {
        EmptyStateView()
      }
    }
    .task(id: pollKey) {
      guard scenePhase == .active, let server = servers.selected else { return }
      await model.poll(server)
    }
  }

  // The offset stays the loadpoint's API index.
  private var connectedFirst: [(offset: Int, element: Loadpoint)] {
    let all = (model.state?.loadpoints ?? []).active
    return all.filter { $0.element.connected == true } + all.filter { $0.element.connected != true }
  }

  private func pages(_ server: StoredServer) -> some View {
    TabView(selection: $page) {
      OverviewPage(model: model)
        .tag(Self.overviewPage)
      ForEach(connectedFirst, id: \.offset) { index, lp in
        LoadpointPage(model: model, server: server, index: index, loadpoint: lp)
          .tag(index)
      }
    }
    .tabViewStyle(.verticalPage)
    .onChange(of: server.id) { page = Self.overviewPage }
    .alert(L.t("watch.modeFailed"), isPresented: $model.modeFailed) {
      Button("OK", role: .cancel) {}
    }
  }
}

struct ServerPicker: View {
  @Binding var selectedId: String?
  let servers: [StoredServer]
  @Environment(\.dismiss) private var dismiss

  var body: some View {
    List(servers) { server in
      Button {
        selectedId = server.id
        dismiss()
      } label: {
        HStack {
          Text(server.displayTitle).lineLimit(2)
          Spacer()
          if server.id == selectedId {
            Image(systemName: "checkmark").foregroundStyle(Color.evccDarkGreen)
          }
        }
      }
    }
    .navigationTitle(L.t("widget.config.server"))
  }
}

struct EmptyStateView: View {
  var body: some View {
    VStack(spacing: 8) {
      Image(systemName: "iphone")
        .font(.title2)
        .foregroundStyle(Color.evccDarkGreen)
      Text(L.t("watch.empty.title")).font(.headline)
      Text(L.t("watch.empty.body"))
        .font(.footnote)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)
    }
    .padding()
  }
}
